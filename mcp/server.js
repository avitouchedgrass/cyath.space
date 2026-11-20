#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports -- The CLI runs as CommonJS on Node.js 20 and later. */

/**
 * Cyath MCP Server
 * Zero-dependency Model Context Protocol (MCP) server for Cyath visual review canvas.
 * Allows AI coding assistants (Cursor, Claude Code, Antigravity) to inspect, comment on,
 * and resolve visual feedback pins directly from the terminal or editor.
 */

const readline = require("node:readline");
const { randomUUID } = require("node:crypto");

const apiBase = new URL(process.env.CYATH_API_URL || "https://cyath.space");
const isLoopback = ["127.0.0.1", "localhost", "[::1]"].includes(apiBase.hostname);
if ((apiBase.protocol !== "https:" && !(isLoopback && apiBase.protocol === "http:")) ||
    apiBase.username || apiBase.password || apiBase.pathname !== "/" || apiBase.search || apiBase.hash) {
  throw new Error("CYATH_API_URL must be an HTTPS origin or a local HTTP origin.");
}
const API_KEY = process.env.CYATH_API_KEY;

function canvasPath(shareId) {
  if (typeof shareId !== "string" || !/^[A-Za-z0-9_-]{8,64}$/.test(shareId)) {
    throw new Error("Enter a valid Cyath share ID.");
  }
  return "/api/canvases/" + encodeURIComponent(shareId);
}

async function request(path, method = "GET", body) {
  if (!API_KEY) throw new Error("Generate a Cyath Pro API key in Settings and set CYATH_API_KEY.");
  let response;
  try {
    response = await fetch(new URL(path, apiBase), {
      method,
      headers: {
        Authorization: "Bearer " + API_KEY,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      redirect: "error",
      signal: AbortSignal.timeout(15000),
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Could not reach the Cyath API. Check CYATH_API_URL and try again.");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || "Cyath API returned HTTP " + response.status);
  }
  if (!data) throw new Error("Cyath API returned an unexpected response.");
  return data;
}

function fetchCanvas(shareId) {
  return request(canvasPath(shareId));
}

function selectPin(canvas, input) {
  if (typeof input !== "string") throw new Error("Enter a pin ID or number.");
  const pin = canvas.pins.find(p => p.id === input || String(p.number) === input.replace(/^#/, ""));
  if (!pin) throw new Error("That pin could not be found on the canvas.");
  return pin;
}

const TOOLS = [
  {
    name: "cyath_get_pins",
    description: "Fetch all visual feedback pins and client change requests for a given Cyath canvas share ID.",
    inputSchema: {
      type: "object",
      properties: {
        shareId: {
          type: "string",
          description: "The share ID from a Cyath review link owned by your account",
        },
        status: {
          type: "string",
          enum: ["open", "resolved", "all"],
          description: "Filter pins by resolution status (defaults to 'open')",
        },
      },
      required: ["shareId"],
    },
  },
  {
    name: "cyath_resolve_pin",
    description: "Mark a visual feedback pin as resolved and optionally append an explanation of the code fix.",
    inputSchema: {
      type: "object",
      properties: {
        shareId: {
          type: "string",
          description: "The share ID of the canvas",
        },
        pinId: {
          type: "string",
          description: "The ID or pin number (e.g. '1', '2', or UUID) to resolve",
        },
        resolutionComment: {
          type: "string",
          description: "Explanation of how the issue was resolved (e.g. 'Fixed in commit abc: adjusted button padding and responsive font size')",
        },
        resolvedBy: {
          type: "string",
          description: "Name of the developer or agent (defaults to 'AI Assistant')",
        },
      },
      required: ["shareId", "pinId"],
    },
  },
  {
    name: "cyath_add_comment",
    description: "Post a response or clarifying question on a visual feedback pin thread.",
    inputSchema: {
      type: "object",
      properties: {
        shareId: {
          type: "string",
          description: "The share ID of the canvas",
        },
        pinId: {
          type: "string",
          description: "The ID or pin number of the target pin",
        },
        comment: {
          type: "string",
          description: "The message content to post into the thread",
        },
        authorName: {
          type: "string",
          description: "Name of the author (defaults to 'Developer')",
        },
      },
      required: ["shareId", "pinId", "comment"],
    },
  },
  {
    name: "cyath_create_canvas",
    description: "Programmatically spawn a new Cyath staging review canvas for a website URL or PR preview.",
    inputSchema: {
      type: "object",
      properties: {
        targetUrl: {
          type: "string",
          description: "The live preview or staging URL to mount (e.g. 'https://my-app-preview.vercel.app')",
        },
        title: {
          type: "string",
          description: "Project or milestone title",
        },
        agencyName: {
          type: "string",
          description: "Studio or organization name",
        },
      },
      required: ["targetUrl"],
    },
  },
];

async function handleToolCall(name, args) {
  if (name === "cyath_get_pins") {
    const { shareId, status = "open" } = args;
    const canvas = await fetchCanvas(shareId);
    if (!["open", "resolved", "all"].includes(status)) throw new Error("Choose open, resolved, or all.");
    let pins = canvas.pins || [];

    if (status === "open") {
      pins = pins.filter((p) => p.status !== "resolved");
    } else if (status === "resolved") {
      pins = pins.filter((p) => p.status === "resolved");
    }

    if (pins.length === 0) {
      return {
        text: `No ${status} pins found for canvas "${canvas.title || shareId}".`,
      };
    }

    const lines = [
      `# Cyath Review Canvas: ${canvas.title || "Staging Review"}`,
      `Share ID: ${shareId}`,
      `Target URL: ${canvas.targetUrl}`,
      `Milestone Status: ${canvas.isApproved ? "Approved" : "In Review"}`,
      `Total Matching Pins: ${pins.length}`,
      "",
      "---",
    ];

    pins.forEach((pin) => {
      lines.push(`\n### Pin #${pin.number} [${pin.status.toUpperCase()}]`);
      lines.push(`- Pin ID: ${pin.id}`);
      lines.push(`- Viewport Mode: ${pin.deviceMode}`);
      lines.push(`- Location: (${pin.xPercent}%, ${pin.yPercent}%)`);
      if (pin.telemetry) {
        lines.push(`- Browser / OS: ${pin.telemetry.browser || "Unknown"} on ${pin.telemetry.os || "Unknown"} (${pin.telemetry.viewportWidth || "—"}x${pin.telemetry.viewportHeight || "—"})`);
      }
      if (pin.domAnchor?.selector) lines.push(`- Element: ${pin.domAnchor.selector}`);
      lines.push(`- Created: ${pin.createdAt}`);
      lines.push(`\n**Comments & Notes:**`);
      (pin.comments || []).forEach((c) => {
        lines.push(`> **${c.authorName} (${c.authorRole || "client"}):** ${c.content}`);
      });
      lines.push("---");
    });

    return { text: lines.join("\n") };
  }

  if (name === "cyath_resolve_pin") {
    const { shareId, pinId, resolutionComment, resolvedBy = "AI Assistant" } = args;
    const pin = selectPin(await fetchCanvas(shareId), pinId);
    await request(canvasPath(shareId), "PATCH", {
      type: "status", pinId: pin.id, status: "resolved", name: resolvedBy,
      comment: resolutionComment || undefined, id: randomUUID(),
    });
    return { text: "Resolved pin #" + pin.number + (resolutionComment ? " and saved the explanation." : ".") };
  }

  if (name === "cyath_add_comment") {
    const { shareId, pinId, comment, authorName = "Developer" } = args;
    if (typeof comment !== "string" || !comment.trim()) throw new Error("Enter a reply before sending.");
    const pin = selectPin(await fetchCanvas(shareId), pinId);
    await request(canvasPath(shareId), "PATCH", {
      type: "reply", pinId: pin.id, id: randomUUID(), content: comment, name: authorName,
    });
    return { text: "Added a reply to pin #" + pin.number + "." };
  }

  if (name === "cyath_create_canvas") {
    const { targetUrl, title, agencyName } = args;
    const canvas = await request("/api/canvases", "POST", { targetUrl, title, agencyName, requestId: randomUUID() });
    return { text: "Created " + canvas.title + "\nShare ID: " + canvas.shareId +
      "\nReview URL: " + new URL("/r/" + canvas.shareId, apiBase) };
  }

  throw new Error(`Unknown tool: ${name}`);
}

const protocolVersions = new Set(["2024-11-05", "2025-03-26", "2025-06-18", "2025-11-25"]);

const rl = readline.createInterface({ input: process.stdin, terminal: false });

function send(id, result, error) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, ...(error ? { error } : { result }) }) + "\n");
}

rl.on("line", async line => {
  if (!line.trim()) return;
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    send(null, null, { code: -32700, message: "Invalid JSON." });
    return;
  }
  if (!message || message.jsonrpc !== "2.0" || typeof message.method !== "string" ||
      (message.id !== undefined && typeof message.id !== "string" && typeof message.id !== "number")) {
    send(null, null, { code: -32600, message: "Invalid JSON-RPC request." });
    return;
  }

  const { id, method, params } = message;
  if (id === undefined) return;

  if (method === "initialize") {
    send(id, {
      protocolVersion: protocolVersions.has(params?.protocolVersion) ? params.protocolVersion : "2025-11-25",
      capabilities: { tools: {} },
      serverInfo: { name: "cyath-mcp", version: "1.1.0" },
    });
  } else if (method === "ping") {
    send(id, {});
  } else if (method === "tools/list") {
    send(id, { tools: TOOLS });
  } else if (method === "tools/call") {
    if (!params || !TOOLS.some(tool => tool.name === params.name) ||
        (params.arguments !== undefined && (!params.arguments || typeof params.arguments !== "object" || Array.isArray(params.arguments)))) {
      send(id, null, { code: -32602, message: "Unknown tool or invalid arguments." });
      return;
    }
    try {
      const result = await handleToolCall(params.name, params.arguments ?? {});
      send(id, { content: [{ type: "text", text: result.text }] });
    } catch (error) {
      send(id, { isError: true, content: [{ type: "text", text: error.message }] });
    }
  } else {
    send(id, null, { code: -32601, message: "Method not found: " + method });
  }
});
