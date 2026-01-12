# MCP Server Runtime Issue

## Problem

Python MCP servers cannot run in Netlify Functions because:

1. **Python is only available during BUILD, not RUNTIME**
   - `PYTHON_VERSION = "3.11"` in netlify.toml only affects build phase
   - Netlify Functions run in a Node.js environment
   - Error: `spawn python3 ENOENT` - Python executable not found

2. **MCP servers use stdio communication**
   - Requires spawning child processes (`python3 server.py`)
   - Child processes don't have Python available in Netlify runtime
   - All 6 MCP servers fail to initialize

## Impact

Without MCP tools, Gemini cannot:
- ❌ Fetch actual web pages (`fetch_url`)
- ❌ Run axe-core accessibility tests (`analyze_html`)
- ❌ Query WCAG documentation (`get_wcag_criterion`)
- ❌ Access WAI-ARIA best practices
- ❌ Check component testing checklists

Result: **Audit uses only AI heuristics** - makes educated guesses instead of actual testing.

## Solutions

### Option 1: Convert MCP Servers to TypeScript/JavaScript (RECOMMENDED)

Rewrite MCP servers in TypeScript to run natively in Node.js:

```typescript
// netlify/functions/lib/mcp-tools/fetch.ts
export async function fetchUrl(url: string): Promise<string> {
  const response = await fetch(url);
  return await response.text();
}
```

**Pros:**
- Works in Netlify runtime
- Faster (no child process overhead)
- Easier to debug

**Cons:**
- Need to rewrite 6 servers
- Lose MCP protocol benefits

### Option 2: Use Netlify Build Plugin for Python

Create a build plugin that bundles Python runtime with functions:

```toml
[[plugins]]
  package = "@netlify/plugin-python"
```

**Pros:**
- Keep existing Python MCP servers
- Standard MCP protocol

**Cons:**
- Adds deployment complexity
- May increase cold start time
- Not officially supported

### Option 3: Use Gemini Without MCP (QUICK FIX)

Make Gemini work standalone without requiring tools:

```typescript
// Remove MCP dependency, use direct API calls
async function runGeminiAuditInternal(request: AuditRequest, apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Fetch URL content directly in function
  let htmlContent = request.content;
  if (request.mode === 'url') {
    const response = await fetch(request.content);
    htmlContent = await response.text();
  }
  
  // Pass HTML directly to Gemini (no tools needed)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: "Analyze this HTML for accessibility issues...",
  });
  
  const result = await model.generateContent(htmlContent);
  // ... process result
}
```

**Pros:**
- Works immediately
- Simple implementation
- No deployment changes

**Cons:**
- Limited to Gemini's knowledge
- Can't run actual axe-core tests
- Less accurate than tool-based approach

## Recommended Path Forward

**Phase 1: Quick Fix (TODAY)**
1. Implement Option 3 - make it work without MCP
2. Use direct fetch() for URLs
3. Use Gemini's built-in accessibility knowledge
4. Deploy and verify audits work

**Phase 2: Proper Solution (NEXT WEEK)**
1. Convert critical tools to TypeScript:
   - fetch-server → simple fetch() wrapper
   - axe-core-server → use axe-core npm package directly
   - wcag-docs-server → static WCAG data file
2. Keep MCP protocol for structure
3. Run as in-process tools instead of child processes

**Phase 3: Advanced (FUTURE)**
1. Add screenshot capabilities (Puppeteer)
2. Add PDF/DOCX parsing
3. Implement full MCP protocol with proper server infrastructure

## Migration Status

Also need to run database migration:

```bash
# supabase/migrations/015_add_audit_trace.sql
ALTER TABLE audits ADD COLUMN IF NOT EXISTS audit_methodology JSONB;
```

Error from Netlify logs:
```
Could not find the 'audit_methodology' column of 'audits' in the schema cache
```

Run this on production Supabase:
1. Go to Supabase Dashboard → SQL Editor
2. Paste contents of `015_add_audit_trace.sql`
3. Execute

---

**Decision:** Implementing Option 3 (Quick Fix) now, then Option 1 (TypeScript rewrite) next.
