import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:http";
import { createInterface } from "node:readline";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";

const owner = "d975dda2-6e17-4f5a-8f52-77058aa72103";
const otherOwner = "048183fc-70c9-4ed0-9943-54a235256aaf";
const keys = ["A", "B"].map(value => "cyath_pro_" + value.repeat(43));
const fakeServiceKey = "synthetic-test-service-key";
const hash = value => createHash("sha256").update(value).digest("hex");

async function listen(server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return server.address().port;
}

function createDatabase() {
  const rows = new Map();
  let rejectedCas = 0;
  let failUpdates = false;
  const server = createServer(async (request, response) => {
    const reply = (status, data) => {
      response.writeHead(status, { "Content-Type": "application/json" });
      response.end(JSON.stringify(data));
    };
    if (request.headers.authorization !== "Bearer " + fakeServiceKey) return reply(401, { message: "Wrong fixture key" });
    try {
      const url = new URL(request.url, "http://127.0.0.1");
      const eq = key => url.searchParams.get(key)?.replace(/^eq\./, "");
      const read = async () => {
        const chunks = [];
        for await (const chunk of request) chunks.push(chunk);
        return JSON.parse(Buffer.concat(chunks).toString());
      };
      switch (url.pathname) {
        case "/rest/v1/review_entitlements":
          return reply(200, [owner, otherOwner].includes(eq("owner_id")) ? [{ owner_id: eq("owner_id") }] : []);
        case "/rest/v1/review_mcp_keys": {
          const index = keys.findIndex(key => hash(key) === eq("token_digest"));
          return reply(200, index < 0 ? [] : [{ owner_id: index === 0 ? owner : otherOwner }]);
        }
        case "/rest/v1/rpc/create_review_canvas": {
          const input = await read();
          const previous = [...rows.values()].find(row => row.owner_id === input.p_owner_id &&
            input.p_request_id && input.p_request_id === row.request_id);
          if (previous) return reply(200, previous);
          const row = {
            owner_id: input.p_owner_id, share_id: input.p_share_id, request_id: input.p_request_id,
            project: input.p_project, approval_digest: null, approval_expires_at: null, revision: 1,
          };
          rows.set(row.share_id, row);
          return reply(200, row);
        }
        case "/rest/v1/review_canvases": {
          const share = eq("share_id");
          if (request.method === "PATCH") {
            const change = await read();
            if (failUpdates) return reply(503, { code: "57014", message: "Synthetic database outage" });
            await delay(30);
            const current = rows.get(share);
            if (!current || current.revision !== Number(eq("revision"))) {
              rejectedCas++;
              return reply(200, []);
            }
            const next = { ...current, ...change };
            rows.set(share, next);
            return reply(200, [next]);
          }
          const results = [...rows.values()].filter(row =>
            (!share || row.share_id === share) && (!eq("owner_id") || row.owner_id === eq("owner_id")));
          return reply(200, results);
        }
        default:
          return reply(404, { message: "Unknown fixture endpoint" });
      }
    } catch {
      reply(500, { message: "Fixture request failed" });
    }
  });
  return { server, rows, rejectedCas: () => rejectedCas, failUpdates: value => { failUpdates = value; } };
}

async function startApp(t, database) {
  const databasePort = await listen(database.server);
  t.after(() => database.server.close());
  const temporaryPort = createServer();
  const port = await listen(temporaryPort);
  await new Promise(resolve => temporaryPort.close(resolve));
  const origin = "http://127.0.0.1:" + port;
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    env: {
      ...process.env, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:" + databasePort,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "synthetic-test-anon-key", SUPABASE_SERVICE_ROLE_KEY: fakeServiceKey,
      SUPABASE_URL: "http://127.0.0.1:" + databasePort, SUPABASE_ANON_KEY: "synthetic-test-anon-key",
      NEXT_TELEMETRY_DISABLED: "1", BLOB_STORE_ID: "", BLOB_READ_WRITE_TOKEN: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(() => child.kill());
  let output = "";
  for (const stream of [child.stdout, child.stderr]) stream.on("data", chunk => { output += chunk; });
  for (let i = 0; i < 150 && child.exitCode === null; i++) {
    const response = await fetch(origin + "/api/mcp/verify", {
      headers: { Authorization: "Bearer " + keys[0] }, signal: AbortSignal.timeout(1000),
    }).catch(() => null);
    if (response?.ok) return origin;
    await delay(200);
  }
  throw new Error("Isolated Next.js server did not start:\n" + output);
}

function connectMcp(t, origin, key) {
  const child = spawn(process.execPath, ["mcp/server.js"], {
    env: { ...process.env, CYATH_API_URL: origin, CYATH_API_KEY: key },
    stdio: ["pipe", "pipe", "pipe"],
  });
  t.after(() => child.kill());
  let sequence = 0;
  const pending = new Map();
  createInterface({ input: child.stdout }).on("line", line => {
    const message = JSON.parse(line);
    pending.get(message.id)?.(message);
  });
  return {
    send(method, params) {
      child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n");
    },
    call(method, params) {
      const id = ++sequence;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => { pending.delete(id); reject(new Error("MCP timed out calling " + method)); }, 20000);
        pending.set(id, message => {
          clearTimeout(timer);
          pending.delete(id);
          resolve(message);
        });
        child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
      });
    },
  };
}

const note = (id, content) => ({
  type: "addPin", id, x: 25, y: 50, content, name: "Test reviewer",
  telemetry: { deviceType: "mobile", viewportWidth: 375, viewportHeight: 640, devicePixelRatio: 2,
    scrollDepthPercent: 0, browser: "Chromium", os: "Test" },
});

test("MCP and guest reviewers share an authorized, revision-safe review API", { timeout: 120000 }, async t => {
  const database = createDatabase();
  const origin = await startApp(t, database);
  assert.equal((await fetch(origin + "/api/auth/signup", { method: "POST" })).status, 410);
  const mcp = connectMcp(t, origin, keys[0]);
  const init = await mcp.call("initialize", { protocolVersion: "2025-11-25" });
  assert.equal(init.result.protocolVersion, "2025-11-25");
  mcp.send("notifications/initialized");
  const listed = await mcp.call("tools/list");
  assert.deepEqual(listed.result.tools.map(tool => tool.name).sort(),
    ["cyath_add_comment", "cyath_create_canvas", "cyath_get_pins", "cyath_resolve_pin"]);
  const invoke = (name, args, client = mcp) => client.call("tools/call", { name, arguments: args });

  const stagedUrl = "https://example.com/demo?return=work%26version%3D4";
  const created = await invoke("cyath_create_canvas", { targetUrl: stagedUrl, title: "Smoke test" });
  assert.equal(created.result.isError, undefined);
  const shareId = created.result.content[0].text.match(/Share ID: ([\w-]+)/)[1];
  assert.match(created.result.content[0].text, new RegExp("/r/" + shareId + "$"));
  const canvasUrl = origin + "/api/canvases/" + shareId;
  const createdCanvas = await (await fetch(canvasUrl)).json();
  assert.equal(createdCanvas.targetUrl, stagedUrl);
  assert.deepEqual(createdCanvas.access, { canManage: false, canApprove: false });

  const edit = (action, key, extra = {}) => fetch(canvasUrl, {
    method: "PATCH", body: JSON.stringify(action),
    headers: { "Content-Type": "application/json", ...(key ? { Authorization: "Bearer " + key } : {}), ...extra },
  });
  const first = randomUUID();
  const second = randomUUID();
  const writes = await Promise.all([edit(note(first, "First note")), edit(note(second, "Second note"))]);
  assert.deepEqual(writes.map(response => response.status), [200, 200]);
  assert.ok(database.rejectedCas() > 0, "the fixture must exercise at least one compare-and-swap retry");
  assert.equal((await edit(note(first, "First note"))).status, 200);
  const list = await invoke("cyath_get_pins", { shareId, status: "open" });
  assert.match(list.result.content[0].text, /First note/);
  assert.match(list.result.content[0].text, /Second note/);
  assert.match(list.result.content[0].text, /375x640/);
  assert.equal((await edit({ type: "status", pinId: first, status: "resolved" })).status, 403);
  assert.equal((await edit({ type: "approve", name: "Reviewer" })).status, 403);
  assert.equal((await edit(note(randomUUID(), "Cross-origin draft"), undefined, { Origin: "https://example.org" })).status, 403);

  const other = connectMcp(t, origin, keys[1]);
  assert.equal((await invoke("cyath_get_pins", { shareId }, other)).result.isError, true);
  const unknown = connectMcp(t, origin, "cyath_pro_" + "X".repeat(43));
  assert.equal((await invoke("cyath_get_pins", { shareId }, unknown)).result.isError, true);
  assert.match((await invoke("cyath_add_comment", { shareId, pinId: first, comment: "Working on it" })).result.content[0].text, /Added a reply/);
  assert.match((await invoke("cyath_resolve_pin", { shareId, pinId: first, resolutionComment: "Verified at 375 px" }))
    .result.content[0].text, /Resolved pin/);
  const resolved = await invoke("cyath_get_pins", { shareId, status: "resolved" });
  assert.match(resolved.result.content[0].text, /Verified at 375 px/);
  assert.doesNotMatch(resolved.result.content[0].text, /Second note/);

  const approvalLink = await edit({ type: "approvalLink" }, keys[0]);
  const { approvalToken } = await approvalLink.json();
  assert.equal(approvalLink.status, 200);
  assert.equal((await edit({ type: "approve", name: "Client approver" }, undefined, { "X-Cyath-Approval": approvalToken })).status, 409);

  database.failUpdates(true);
  assert.equal((await edit({ type: "deletePin", pinId: first }, keys[0])).status, 503);
  database.failUpdates(false);
  assert.equal((await edit({ type: "deletePin", pinId: first }, keys[0])).status, 200);
  assert.equal((await edit({ type: "deletePin", pinId: second }, keys[0])).status, 200);
  assert.deepEqual((await (await fetch(canvasUrl)).json()).pins, []);
  const approved = await edit({ type: "approve", name: "Client approver" }, undefined, { "X-Cyath-Approval": approvalToken });
  assert.equal(approved.status, 200);
  assert.equal((await approved.json()).project.isApproved, true);
  assert.equal(database.rows.get(shareId).approval_digest, null);
  assert.equal((await edit(note(randomUUID(), "Late note"))).status, 409);
  assert.equal((await edit({ type: "reopen" }, keys[0])).status, 200);
});
