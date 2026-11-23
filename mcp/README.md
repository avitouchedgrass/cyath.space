# Cyath Model Context Protocol (MCP) server

The Cyath MCP server connects client feedback threads directly to coding assistants such as Cursor, Claude Code, and Antigravity.

The server requires Node.js 20 or later, an active Cyath Pro subscription, and an API key generated under Settings → API Keys. Each key can access only reviews owned by the account that generated it. Generating a new key replaces the previous one. Store the key in your editor's local configuration and keep it out of version control.

## Tools

| Tool | Parameters | Description |
| :--- | :--- | :--- |
| `cyath_get_pins` | `shareId`, `status` (`open` \| `resolved` \| `all`) | Fetches visual pins, coordinates, viewport modes, telemetry, and discussion comments. |
| `cyath_resolve_pin` | `shareId`, `pinId` (or pin number `#1`), `resolutionComment`, `resolvedBy` | Marks a pin as resolved and appends the explanation to the punchlist. |
| `cyath_add_comment` | `shareId`, `pinId`, `comment`, `authorName` | Posts a response or clarifying note into a feedback thread. |
| `cyath_create_canvas` | `targetUrl`, `title`, `agencyName` | Creates a new staging review canvas for preview deployments or pull requests. |

## Configuration

Clone this repository and point your editor configuration to the absolute path of `mcp/server.js`. Set `CYATH_API_URL` only when connecting to a custom deployment (default is `https://cyath.space`).

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

### 3. CLI runner
```bash
CYATH_API_KEY="cyath_pro_..." node mcp/server.js
```

## Example workflow

1. A client drops pins on a review link shared from Cyath.
2. In Cursor or Claude, you ask:
   > "@cyath check canvas `<shareId>` for open pins and fix the responsive button padding on mobile."
3. The agent calls `cyath_get_pins`, inspects the viewport (`mobile: 375px`) and coordinate telemetry, applies the fix, and invokes `cyath_resolve_pin` with:
   > "Adjusted `px-4 py-2` on mobile viewport to prevent title collision in commit a1b2c3d."
4. When the canvas refreshes, the client sees the resolved pin and explanation.

Run `npm run test:mcp` from the repository root to verify initialization, tool discovery, canvas creation, comment threads, and resolution against local endpoints.
