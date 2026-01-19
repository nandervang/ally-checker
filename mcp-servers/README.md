# Ally Checker MCP Servers

This directory contains specialized Model Context Protocol (MCP) servers used by the Ally Checker application.

## Active Servers

### 1. Document Accessibility Server (`mcp-servers/document-accessibility-server`)
Provides tools for auditing DOCX and PDF documents. This server is Python-based (due to specialized library dependencies like `python-docx` and `pdfminer`) and requires a local Python environment.

**Tools:**
- `audit_docx`: Analyze DOCX documents
- `audit_pdf`: Analyze PDF documents

**Status**: Active.
- **Production**: Invoked via `spawn("python3", ...)` from the Node.js functions. Requires Python environment (currently limited support in Netlify Functions).
- **Development**: Runs locally if Python dependencies are installed (`pip install -r requirements.txt`).

### 2. Supabase Schema Server (`mcp-servers/supabase-schema-server`)
Provides database schema introspection for Supabase. Primarily used for development/agentic tasks to understand the database structure.

**Tools:**
- `list_tables`
- `get_table_schema`
- `get_table_relationships`

**Status**: Development Tool Only.

---

## Migrated Servers (Removed from this directory)

The following servers have been migrated to native TypeScript implementations for better performance and compatibility with Netlify Functions runtime. The Python versions have been removed.

- **Fetch Server** → `netlify/functions/lib/mcp-tools/fetch.ts`
- **WCAG Docs Server** → `netlify/functions/lib/mcp-tools/wcag-docs.ts`
- **Axe-Core Server** → `netlify/functions/lib/mcp-tools/axe-core.ts`
- **WAI Tips Server** → `netlify/functions/lib/mcp-tools/wai-tips.ts`
- **Magenta Server** → `netlify/functions/lib/mcp-tools/magenta.ts`

See [MCP_TYPESCRIPT_MIGRATION.md](../docs/MCP_TYPESCRIPT_MIGRATION.md) for full details.
