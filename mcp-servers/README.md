# Ally Checker MCP Servers

Python-based Model Context Protocol servers for accessibility analysis.

## Servers

### 1. Fetch Server (`mcp-servers/fetch-server`)
Fetches web content for accessibility analysis.

**Tools:**
- `fetch_url`: Fetch HTML content from URLs
- `fetch_url_metadata`: Get URL metadata without full content

**Install:**
```bash
cd mcp-servers/fetch-server
pip install -r requirements.txt
```

**Run:**
```bash
python server.py
```

### 2. WCAG Docs Server (`mcp-servers/wcag-docs-server`)
Provides WCAG 2.2 success criteria documentation.

**Tools:**
- `get_wcag_criterion`: Get details for specific criterion (e.g., "1.1.1")
- `search_wcag_by_principle`: Search by principle (Perceivable, Operable, etc.)
- `get_all_criteria`: List all criteria

**Install:**
```bash
cd mcp-servers/wcag-docs-server
pip install -r requirements.txt
```

**Run:**
```bash
python server.py
```

### 3. Axe-Core Server (`mcp-servers/axe-core-server`)
Runs axe-core automated accessibility testing.

**Tools:**
- `analyze_html`: Analyze HTML content
- `analyze_url`: Fetch and analyze a URL

**Install:**
```bash
cd mcp-servers/axe-core-server
pip install -r requirements.txt
playwright install chromium
```

**Run:**
```bash
python server.py
```

## Usage with Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ally-checker-fetch": {
      "command": "python",
      "args": ["/path/to/ally-checker/mcp-servers/fetch-server/server.py"]
    },
    "ally-checker-wcag-docs": {
      "command": "python",
      "args": ["/path/to/ally-checker/mcp-servers/wcag-docs-server/server.py"]
    },
    "ally-checker-axe-core": {
      "command": "python",
      "args": ["/path/to/ally-checker/mcp-servers/axe-core-server/server.py"]
    }
  }
}
```

## Development

Each server is a standalone Python application using the MCP SDK. They communicate via stdio with AI agents (Claude, Gemini, etc.) that can orchestrate accessibility analysis workflows.
