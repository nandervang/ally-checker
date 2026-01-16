# MCP Tools Reference

This document catalogs the available Model Context Protocol (MCP) tools in the Ally Checker system. These tools are used by the AI Agent to perform actions (like auditing a website) or retrieve context (like looking up WCAG guidelines).

## 🛠️ Tool Architecture

The tools are primarily implemented in TypeScript and run within the Netlify Functions environment. They are loaded dynamically by the AI agent during an audit session.

**Location**: `netlify/functions/lib/mcp-tools/`

### 1. Automated Accessibility Testing (`axe-core.ts` & `playwright.ts`)

These tools use a headless browser (Playwright) to render pages and run the `axe-core` accessibility engine.

| Tool Name | Description | Inputs |
|-----------|-------------|--------|
| `analyze_url` | Full page audit. Navigates to a URL, runs axe-core, and returns violations + passes. | `url` (string) |
| `analyze_html` | Snippet audit. Injects HTML into a blank page, runs axe-core, and returns results. | `html` (string) |
| `capture_element_screenshot` | Takes a screenshot of a specific element for visual verification. | `url` (string), `selector` (string) |
| `capture_violations_screenshots` | Captures screenshots for multiple violations at once. | `url` (string), `violations` (array of objects) |
| `test_keyboard_navigation` | Simulates keyboard tabbing through a page to verify tab order and focusability. | `url` (string), `steps` (number - max tabs) |
| `check_focus_styles` | Verifies that interactive elements have visible focus indicators. | `url` (string), `selector` (optional string) |

### 2. Document Analysis (`document-accessibility.ts`)

These tools audit static document files (PDF, DOCX) for accessibility issues.

*   **Implementation**: A TypeScript wrapper spawns a Python child process (`mcp-servers/document-accessibility-server/cli.py`) to perform the heavy analysis using libraries like `python-docx` and `pdfminer`.

| Tool Name | Description | Inputs |
|-----------|-------------|--------|
| `audit_docx` | Analyzes a Word document for structure, headings, alt text, and tables. | `file_path` (string - absolute path to temp file) |
| `audit_pdf` | Analyzes a PDF for tagging, reading order, and metadata. | `file_path` (string - absolute path to temp file) |

### 3. Knowledge & Reference

These tools allow the agent to "look up" best practices, guidelines, and testing methodologies.

**WCAG Documentation** (`wcag-docs.ts`)
| Tool Name | Description | Inputs |
|-----------|-------------|--------|
| `get_wcag_criterion` | Get full text, understanding docs, and failure examples for a specific WCAG criterion (e.g., "1.1.1"). | `criterion_id` (string) |
| `search_wcag_by_principle` | List criteria under a principle (Perceivable, Operable, Understandable, Robust). | `principle` (string) |
| `get_all_criteria` | Returns a simplified list of all WCAG 2.1 criteria for broad context. | None |

**WAI Tips & ARIA** (`wai-tips.ts`)
| Tool Name | Description | Inputs |
|-----------|-------------|--------|
| `get_wai_resource` | Retrieve general W3C WAI resources (like 'Developing' or 'Designing' guides). | `resource_type` (string) |
| `search_wai_tips` | Find W3C tips on specific topics (images, forms, keyboard). | `query` (string) |
| `get_aria_pattern` | Get implementation patterns for ARIA components (tabs, dialogs, menus). | `pattern_name` (string) |

**Magenta A11y** (`magenta.ts`)
| Tool Name | Description | Inputs |
|-----------|-------------|--------|
| `get_magenta_component` | Get specific testing checklists (manual + automated) for a UI component. | `component_name` (string) |
| `search_magenta_patterns` | Search for components by keyword (e.g., "popup", "input"). | `query` (string) |
| `get_magenta_testing_methods` | Get standard procedures for visual, keyboard, or screen reader testing. | `method_type` (string) |

### 4. Utilities (`fetch.ts`)

Helper tools for the agent to gather raw context.

| Tool Name | Description | Inputs |
|-----------|-------------|--------|
| `fetch_url` | Gets the raw text content of a webpage (cleaned of script/style). | `url` (string) |
| `fetch_url_metadata` | Gets just the title, description, and key metadata headers. | `url` (string) |

---

## 🤖 Agent Usage

When the `gemini-agent` Netlify Function runs:

1.  **Initialization**: It imports `getTools()` from `netlify/functions/lib/mcp-tools/index.ts`.
2.  **Registration**: This registry aggregates all the tools listed above into a format Gemini accepts (function declarations).
3.  **Orchestration**:
    *   User sends a prompt: "Audit https://example.com"
    *   Gemini determines it needs `analyze_url`.
    *   Gemini stops generation, requests execution of `analyze_url("https://example.com")`.
    *   The system runs the TS function.
    *   Result provided back to Gemini: "Found 12 violations..."
    *   Gemini continues: "I found violations. Let me check the WCAG docs for 1.4.3..."
    *   Gemini requests `get_wcag_criterion("1.4.3")`.
    *   System returns docs.
    *   Gemini generates final report.

## 🧪 Testing the Tools

We have a dedicated test script to verify that tool definitions are valid and that they execute correctly in a simulated environment.

### Run the Test Suite

```bash
bun scripts/test-mcp-tools.ts
```

**What this does:**
1.  **Loads the Registry**: Imports the exact same tool registry used in production.
2.  **Validates Schemas**: Checks that every tool has a valid Zod schema for input validation.
3.  **Executes Dry Runs**: Runs "safe" tools (like `get_wcag_criterion` or `fetch_url_metadata`) to verify they return data.
4.  **Checks Integration**: Verifies that the `document-accessibility` tools can correctly locate their Python dependencies.

**Expected Output:**
```
🔍 Testing MCP Tools Registry...
✅ Loaded 19 tools.

testing get_wcag_criterion...
  ✅ Success: Found 1.1.1 Non-text Content

testing fetch_url_metadata...
  ✅ Success: Fetched metadata for example.com

...
🎉 All tool validations passed!
```
