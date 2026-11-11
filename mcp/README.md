# Cyath MCP Server

Model Context Protocol (MCP) server for **Cyath** — the agentic visual review and client sign-off tool.

Enables AI coding agents (Claude Code, Cursor, Windsurf, Antigravity) to directly inspect visual feedback pins, read client comments, post updates, and resolve design notes from the code editor.

---

## Capabilities & Tools

| Tool | Description |
| :--- | :--- |
| `cyath_get_pins` | Fetches all open or resolved visual pins for a given canvas ID with coordinates, device viewport, and comments. |
| `cyath_resolve_pin` | Marks a pin as resolved and appends a resolution comment explaining the code fix. |
| `cyath_add_comment` | Posts a response or clarifying question to the client thread. |
| `cyath_create_canvas` | Programmatically creates a new staging review canvas for any URL. |

---

## Configuration

### Cursor (`.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "cyath": {
      "command": "node",
      "args": ["<PATH_TO_CYATH>/mcp/server.js"],
      "env": {
        "CYATH_API_URL": "https://cyath-space.vercel.app"
      }
    }
  }
}
```

### Claude Desktop (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "cyath": {
      "command": "node",
      "args": ["<PATH_TO_CYATH>/mcp/server.js"],
      "env": {
        "CYATH_API_URL": "https://cyath-space.vercel.app"
      }
    }
  }
}
```

---

## Example Usage with an AI Assistant

> *"@cyath check canvas `T6X6leLv` and fetch all open pins."*

The assistant will retrieve the punchlist, inspect your local codebase, make the responsive adjustments, and resolve each pin directly on the live client review canvas.
