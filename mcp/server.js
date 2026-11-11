#!/usr/bin/env node

/**
 * Cyath MCP Server
 * Zero-dependency Model Context Protocol (MCP) server for Cyath visual review canvas.
 * Allows AI coding assistants (Cursor, Claude Code, Antigravity) to inspect, comment on,
 * and resolve visual feedback pins directly from the terminal or editor.
 */

const readline = require("readline");

const DEFAULT_API_BASE = process.env.CYATH_API_URL || "https://cyath-space.vercel.app";

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

async function fetchCanvas(shareId) {
  const url = `${DEFAULT_API_BASE}/api/canvases/${shareId}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch canvas "${shareId}" (Status: ${res.status})`);
  }
  return await res.json();
}

async function saveCanvas(shareId, canvasData) {
  const url = `${DEFAULT_API_BASE}/api/canvases/${shareId}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(canvasData),
  });
  if (!res.ok) {
    throw new Error(`Failed to save canvas "${shareId}" (Status: ${res.status})`);
  }
  return await res.json();
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
          description: "The 8-character share ID of the review canvas (e.g. 'T6X6leLv')",
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

const API_KEY = process.env.CYATH_API_KEY;

async function verifyProAccess() {
  if (!API_KEY) {
    throw new Error(
      "CYATH_API_KEY environment variable is missing.\n" +
      "The Cyath MCP Server is an exclusive Studio Pro feature.\n" +
      "To unlock, upgrade to Studio Pro at https://cyath-space.vercel.app/dashboard, copy your key from Studio Settings, and add it to your MCP configuration:\n\n" +
      '  "env": { "CYATH_API_KEY": "cyath_pro_..." }'
    );
  }

  if (!API_KEY.startsWith("cyath_pro_") && !API_KEY.startsWith("cyath_live_")) {
    throw new Error(
      "Invalid CYATH_API_KEY. Studio Pro keys begin with 'cyath_pro_'.\n" +
      "Obtain your key from Studio Settings at https://cyath-space.vercel.app/dashboard."
    );
  }

  try {
    const authUrl = `${DEFAULT_API_BASE}/api/mcp/verify?key=${encodeURIComponent(API_KEY)}`;
    const authRes = await fetch(authUrl, { cache: "no-store" });
    if (!authRes.ok) {
      const errJson = await authRes.json().catch(() => ({}));
      throw new Error(errJson.error || "Studio Pro authentication failed.");
    }
  } catch (err) {
    if (err.message && (err.message.includes("Studio Pro") || err.message.includes("CYATH_API_KEY"))) {
      throw err;
    }
    // Fallback if offline
    if (!API_KEY.startsWith("cyath_pro_")) {
      throw new Error("Studio Pro authentication failed.");
    }
  }
}

async function handleToolCall(name, args) {
  await verifyProAccess();

  if (name === "cyath_get_pins") {
    const { shareId, status = "open" } = args;
    const canvas = await fetchCanvas(shareId);
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
    const canvas = await fetchCanvas(shareId);
    const pins = canvas.pins || [];

    const pin = pins.find(
      (p) => p.id === pinId || String(p.number) === String(pinId)
    );

    if (!pin) {
      throw new Error(`Pin "${pinId}" not found on canvas "${shareId}".`);
    }

    pin.status = "resolved";
    pin.resolvedAt = new Date().toISOString();
    pin.resolvedBy = resolvedBy;

    if (resolutionComment) {
      pin.comments = pin.comments || [];
      pin.comments.push({
        id: generateId(),
        pinId: pin.id,
        authorName: resolvedBy,
        authorRole: "developer",
        content: resolutionComment,
        createdAt: new Date().toISOString(),
      });
    }

    await saveCanvas(shareId, canvas);

    return {
      text: `Successfully resolved Pin #${pin.number} ("${pin.comments[0]?.content || "Note"}") on canvas ${shareId}.${resolutionComment ? ` Added comment: "${resolutionComment}"` : ""}`,
    };
  }

  if (name === "cyath_add_comment") {
    const { shareId, pinId, comment, authorName = "Developer" } = args;
    const canvas = await fetchCanvas(shareId);
    const pins = canvas.pins || [];

    const pin = pins.find(
      (p) => p.id === pinId || String(p.number) === String(pinId)
    );

    if (!pin) {
      throw new Error(`Pin "${pinId}" not found on canvas "${shareId}".`);
    }

    pin.comments = pin.comments || [];
    pin.comments.push({
      id: generateId(),
      pinId: pin.id,
      authorName,
      authorRole: "developer",
      content: comment,
      createdAt: new Date().toISOString(),
    });

    await saveCanvas(shareId, canvas);

    return {
      text: `Added comment to Pin #${pin.number}: "${comment}"`,
    };
  }

  if (name === "cyath_create_canvas") {
    const { targetUrl, title, agencyName = "Studio Atelier" } = args;
    const shareId = generateId();

    let formattedUrl = targetUrl.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl;
    }

    const canvasTitle = title || new URL(formattedUrl).hostname.replace(/^www\./, "");

    const newCanvas = {
      id: generateId(),
      shareId,
      title: canvasTitle,
      targetUrl: formattedUrl,
      agencyName,
      assetType: "url",
      isApproved: false,
      createdAt: new Date().toISOString(),
      pins: [],
    };

    await saveCanvas(shareId, newCanvas);

    const fullUrl = `${DEFAULT_API_BASE}/r/${shareId}?u=${encodeURIComponent(formattedUrl)}&t=${encodeURIComponent(canvasTitle)}&a=${encodeURIComponent(agencyName)}`;

    return {
      text: `Staging Canvas Created!\n- Title: ${canvasTitle}\n- Share ID: ${shareId}\n- Live Review URL: ${fullUrl}`,
    };
  }

  throw new Error(`Unknown tool: ${name}`);
}

// Set up STDIO JSON-RPC reader
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

function sendResponse(id, result, error = null) {
  const response = {
    jsonrpc: "2.0",
    id,
  };
  if (error) {
    response.error = {
      code: error.code || -32603,
      message: error.message || "Internal error",
    };
  } else {
    response.result = result;
  }
  process.stdout.write(JSON.stringify(response) + "\n");
}

rl.on("line", async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  try {
    const request = JSON.parse(trimmed);
    const { id, method, params } = request;

    if (method === "initialize") {
      sendResponse(id, {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: "cyath-mcp",
          version: "1.0.0",
        },
      });
      return;
    }

    if (method === "notifications/initialized") {
      // Client confirmed initialization
      return;
    }

    if (method === "tools/list") {
      sendResponse(id, {
        tools: TOOLS,
      });
      return;
    }

    if (method === "tools/call") {
      const { name, arguments: toolArgs } = params;
      try {
        const result = await handleToolCall(name, toolArgs || {});
        sendResponse(id, {
          content: [
            {
              type: "text",
              text: result.text,
            },
          ],
        });
      } catch (toolErr) {
        sendResponse(id, null, {
          code: -32000,
          message: toolErr.message,
        });
      }
      return;
    }

    if (method === "ping") {
      sendResponse(id, {});
      return;
    }

    // Unrecognized method
    if (id !== undefined) {
      sendResponse(id, null, {
        code: -32601,
        message: `Method not found: ${method}`,
      });
    }
  } catch (err) {
    sendResponse(null, null, {
      code: -32700,
      message: `Parse error: ${err.message}`,
    });
  }
});

