# Cyath Model Context Protocol (MCP) Server

The **Cyath MCP Server** connects your live client feedback threads directly to AI coding agents (Cursor, Claude Code, Antigravity, Windsurf).

> **Studio Pro Exclusive**: The MCP server requires an active Studio Pro membership and a valid `CYATH_API_KEY` (`cyath_pro_...`), available under **Studio Settings** at [cyath-space.vercel.app/dashboard](https://cyath-space.vercel.app/dashboard).

---

## Tools Exposed

| Tool | Parameters | Description |
| :--- | :--- | :--- |
| `cyath_get_pins` | `shareId`, `status` (`open` \| `resolved` \| `all`) | Fetches all visual pins, pinpoint coordinates, device viewport modes, client telemetry, and discussion comments. |
| `cyath_resolve_pin` | `shareId`, `pinId` (or pin number `#1`), `resolutionComment`, `resolvedBy` | Marks a pin as resolved and appends the code fix explanation directly into the client punchlist. |
| `cyath_add_comment` | `shareId`, `pinId`, `comment`, `authorName` | Posts a response or clarifying note into a feedback thread. |
| `cyath_create_canvas` | `targetUrl`, `title`, `agencyName` | Programmatically creates a new staging review canvas for preview deployments or pull requests. |

---

## Configuration

### 1. Cursor (`.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "cyath": {
      "command": "node",
      "args": ["<PATH_TO_CYATH>/mcp/server.js"],
      "env": {
        "CYATH_API_KEY": "cyath_pro_your_key_here"
      }
    }
  }
}
```

### 2. Claude Desktop (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "cyath": {
      "command": "node",
      "args": ["<PATH_TO_CYATH>/mcp/server.js"],
      "env": {
        "CYATH_API_KEY": "cyath_pro_your_key_here"
      }
    }
  }
}
```

### 3. Antigravity / Custom Agent Runner
```bash
CYATH_API_KEY="cyath_pro_..." node mcp/server.js
```

---

## Example Autonomous Workflow

1. A client drops pins on your staging URL via `https://cyath-space.vercel.app/r/<shareId>`.
2. In Cursor or Claude, you type:
   > *"@cyath check canvas `<shareId>` for open pins and fix the responsive button padding on mobile."*
3. The agent calls `cyath_get_pins`, inspects the exact viewport (`mobile: 375px`) and coordinate telemetry, modifies your Tailwind/CSS classes, tests the change, and invokes `cyath_resolve_pin` with:
   > *"Adjusted `px-4 py-2` on mobile viewport to prevent title collision in commit a1b2c3d."*
4. Your client sees the green resolution badge and explanation on their live canvas instantly.
