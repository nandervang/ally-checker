# Testing MCP Tools

## ✅ Quick Status

All 13 TypeScript MCP tools are deployed and ready to test in production!

## 🧪 Local Testing

You can run a comprehensive verification of the MCP tool registry and basic execution logic using the included test script. This script simulates the tool loading process used by the agent.

```bash
bun scripts/test-mcp-tools.ts
```

This tests:
- ✅ **Registry Integrity**: Verifies all 19 tools are correctly exported and have valid input schemas.
- ✅ **Knowledge Tools**: Verifies WCAG, WAI, and Magenta database lookups work.
- ✅ **Python Integration**: Verifies the path resolution for the Document Accessibility server (that it can find the `cli.py`).
- ✅ **Network Tools**: Verifies `fetch` tools can make outbound requests.

**Note**: Advanced tools like `analyze_url` (which require a Playwright browser instance) are validated for *schema correctness* but may not perform a full browser launch in this simple test script to keep it fast. For full functional testing of the browser audit, rely on the Production Testing steps below.

## 🚀 Production Testing (Full)

The best way to test all tools is through Netlify deployment:

### 1. Check Deployment Status

Visit [Netlify Dashboard](https://app.netlify.com) and verify your latest deployment succeeded.

### 2. Run an Audit Through the UI

1. Go to your deployed site
2. Enter a URL (try: `https://www.w3.org/WAI/`)
3. Click "Run Audit"
4. Wait for results

### 3. Check Netlify Function Logs

Open Netlify Functions logs to see tool execution:

```bash
# Via Netlify CLI (if installed)
netlify functions:log gemini-agent

# Or via Netlify Dashboard
# → Functions → gemini-agent → View logs
```

**Look for:**
```
[MCP] ✓ Loaded 13 tools: fetch_url, fetch_url_metadata, analyze_html, analyze_url, get_wcag_criterion, search_wcag_by_principle, get_all_criteria, get_wai_resource, search_wai_tips, get_aria_pattern, get_magenta_component, search_magenta_patterns, get_magenta_testing_methods

Gemini requesting tool: analyze_url with args: {url: "https://www.w3.org/WAI/"}

Tool result: {
  violations: [...],
  passes: 45,
  summary: { total: 12, critical: 0, serious: 3, ... }
}
```

### 4. Verify Tool Results in Audit

Check the audit response JSON for:
- **axe-core violations**: Real accessibility issues found by automated testing
- **WCAG references**: Links to understanding docs  
- **WAI tips**: Relevant accessibility guidance
- **Magenta patterns**: Component-specific testing recommendations

## 📊 Expected Tool Usage

When Gemini processes a URL audit, it should:

1. **analyze_url** - Fetch the page and run axe-core tests
2. **get_wcag_criterion** - Look up details for violated WCAG criteria
3. **search_wai_tips** - Find relevant accessibility tips
4. **get_magenta_component** - Get testing checklists for components found

For HTML snippet audits:

1. **analyze_html** - Run axe-core on provided HTML
2. **get_wcag_criterion** - Explain violated criteria
3. **get_aria_pattern** - If ARIA widgets detected, get pattern docs

## 🔍 Debugging

If tools aren't being called:

1. **Check Netlify logs** - Are tools loaded? 
   - Should see: `[MCP] ✓ Loaded 13 tools`
   
2. **Check Gemini model config** - Are tools included?
   - Should see: `[Gemini] Model configured with 13 tools`

3. **Check tool execution** - Is Gemini using them?
   - Should see: `Gemini requesting tool: analyze_url...`
   - Should see tool results in response

4. **Check for errors**:
   - Tool execution failures will log errors
   - Check for timeout, network, or parsing errors

## 🎯 Test Cases

### Test Case 1: URL with Known Issues
```
URL: http://example.com (basic page, likely has violations)
Expected: 
- analyze_url called
- Violations found (color contrast, missing alt text, etc.)
- WCAG criteria referenced (1.1.1, 1.4.3, etc.)
```

### Test Case 2: Accessible Site
```
URL: https://www.w3.org/WAI/
Expected:
- analyze_url called
- Fewer violations (WAI is well-maintained)
- Passes count > violations count
```

### Test Case 3: HTML Snippet
```
HTML: <img src="test.jpg"><button>Click</button>
Expected:
- analyze_html called
- Violations: Missing alt text, unclear button text
- Recommendations from Magenta (button patterns)
```

### Test Case 4: ARIA Component
```
HTML: <div role="dialog">...</div>
Expected:
- analyze_html called
- get_aria_pattern("dialog") called
- ARIA best practices referenced
```

## 📝 Success Criteria

✅ All 13 tools loaded in Netlify logs  
✅ Tools called during audit (visible in logs)  
✅ Tool results appear in audit response  
✅ Violations include real axe-core test data  
✅ WCAG references have actual criterion details  
✅ No "spawn python3 ENOENT" errors  

## 🐛 Known Limitations

- **Local axe-core testing**: Won't work outside browser/Netlify environment
- **WCAG database**: Limited to 8 common criteria (fallback for others)
- **Fetch timeout**: 30 seconds max per request
- **Tool rate limits**: None currently, but may add if needed

## 🎉 What Changed

**Before** (Python MCP servers):
- ❌ spawn python3 ENOENT errors
- ❌ 0 tools available to Gemini
- ❌ AI-only heuristics, no actual testing

**After** (TypeScript MCP tools):
- ✅ 13 tools available
- ✅ Real axe-core accessibility testing  
- ✅ WCAG/WAI/Magenta documentation
- ✅ Works in Netlify Functions runtime
- ✅ Faster, more reliable

## 📞 Getting Help

If tools aren't working:

1. Check this document's debugging section
2. Review Netlify function logs
3. Verify deployment succeeded
4. Check git commit history for any reverts
5. Ensure Supabase env vars configured (separate issue)
