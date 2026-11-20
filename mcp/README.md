# Cyath Model Context Protocol (MCP) Server

The **Cyath MCP Server** connects your live client feedback threads directly to AI coding agents (Cursor, Claude Code, Antigravity, Windsurf).

The server requires Node.js 20 or later, an active Cyath Pro subscription, and a key generated under **Settings → API Keys**. Each key can access only reviews owned by the account that generated it. Generating a new key replaces the previous one. Store the key in your editor's local configuration and keep it out of Git.

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

Clone this repository and use the absolute path to `mcp/server.js`. Set `CYATH_API_URL` only when connecting to another Cyath deployment. The default is `https://cyath.space`.

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

1. A client drops pins on a review link you shared from Cyath.
2. In Cursor or Claude, you type:
   > *"@cyath check canvas `<shareId>` for open pins and fix the responsive button padding on mobile."*
3. The agent calls `cyath_get_pins`, inspects the exact viewport (`mobile: 375px`) and coordinate telemetry, modifies your Tailwind/CSS classes, tests the change, and invokes `cyath_resolve_pin` with:
   > *"Adjusted `px-4 py-2` on mobile viewport to prevent title collision in commit a1b2c3d."*
4. When the canvas refreshes, your client sees the resolved pin and its explanation.

Run `npm run test:mcp` from the repository root to exercise initialization, listing tools, creating a canvas, reading notes, commenting, and resolving a pin against the local API.
