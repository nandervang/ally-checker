# AI Agent Mode Architecture

This document describes the AI Agent mode architecture for comprehensive accessibility auditing.

## Overview

Ally Checker supports two analysis modes:

1. **Quick Mode** - Instant client-side testing with axe-core
2. **Agent Mode** - AI-powered comprehensive analysis with MCP tools

## Architecture Diagram

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │
       ├─ Quick Mode → axe-core (client-side)
       │
       ├─ Agent Mode
       │      │
       │      v
       │ ┌──────────────────┐
       │ │ Netlify Function │
       │ │ ai-agent-audit   │
       │ └────────┬─────────┘
       │          │
       │          v
       │ ┌────────────────────────┐
       │ │   AI Model Service     │
       │ │ (Claude/Gemini/GPT-4)  │
       │ └────────┬───────────────┘
       │          │
       │          └─> MCP Tools (stdio)
       │               │
       │               ├─ fetch-server
       │               ├─ wcag-docs-server
       │               └─ axe-core-server
       │
       └─> Results Display
```

## Components

### 1. Frontend (React)

**Location**: `src/components/AuditInputForm.tsx`

- **Agent Mode Toggle**: Switch component for mode selection
- **Model Selector**: Dropdown for AI model choice (Claude, Gemini, GPT-4)
- **Service Integration**: Calls `aiAgentService` when agent mode enabled

**Key Code**:
```typescript
if (agentMode && isAIAgentAvailable()) {
  result = await runAIAgentAudit({
    mode: agentMode,
    content,
    model: selectedModel,
  });
}
```

### 2. AI Agent Service

**Location**: `src/services/aiAgentService.ts`

**Purpose**: Client-side service for calling Netlify Functions

**Functions**:
- `runAIAgentAudit()` - Send audit request to function
- `convertToAuditResult()` - Transform AI response to standard format
- `isAIAgentAvailable()` - Check if AI features are configured
- `getEstimatedAuditTime()` - Provide time estimates for UX

**Request Flow**:
```typescript
interface AIAuditRequest {
  mode: "url" | "html" | "snippet";
  content: string;
  model: "claude" | "gemini" | "gpt4";
  language?: string;
}
```

### 3. Netlify Function

**Location**: `netlify/functions/ai-agent-audit.ts`

**Purpose**: Serverless function that orchestrates AI-powered audits

**Responsibilities**:
- Receive audit requests from frontend
- Route to appropriate AI model service
- Manage MCP server lifecycle (planned)
- Return structured audit results

**Current Implementation**:
- ✅ Claude integration via Anthropic SDK
- ✅ Comprehensive WCAG prompt engineering
- ⏳ MCP tools integration (pending API support)
- ❌ Gemini integration (TODO)
- ❌ GPT-4 integration (TODO)

**Environment Variables**:
```bash
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. MCP Servers (Python)

**Location**: `mcp-servers/`

Three standalone MCP servers provide tools for AI agents:

#### a. Fetch Server
**Location**: `mcp-servers/fetch-server/server.py`

**Tools**:
- `fetch_url` - Retrieve HTML content from URLs
- `fetch_url_metadata` - Get HTTP headers and metadata

**Use Cases**:
- AI agent needs to fetch web pages for analysis
- Check page metadata and content-type

#### b. WCAG Docs Server
**Location**: `mcp-servers/wcag-docs-server/server.py`

**Tools**:
- `get_wcag_criterion` - Get details for specific WCAG criterion
- `search_wcag_by_principle` - Filter criteria by principle (Perceivable, etc.)
- `get_all_criteria` - List all criteria with optional level filter

**Database**: 8 key WCAG 2.2 criteria with examples and documentation links

**Use Cases**:
- AI agent references correct WCAG guidelines
- Provides links to official documentation
- Explains criteria with examples

#### c. Axe-Core Server
**Location**: `mcp-servers/axe-core-server/server.py`

**Tools**:
- `analyze_html` - Run axe-core on HTML content
- `analyze_url` - Navigate to URL and analyze

**Implementation**:
- Uses Playwright headless Chromium browser
- Injects axe-core CDN script
- Runs WCAG 2.2 Level AA rules
- Returns formatted violation reports

**Use Cases**:
- Automated accessibility testing within AI workflow
- Server-side analysis avoiding CORS issues
- Consistent testing environment

## Audit Flow (Agent Mode)

### 1. User Initiates Audit
```typescript
// User toggles Agent Mode ON
// Selects model: Claude (default)
// Enters URL/HTML/snippet
// Clicks "Run Audit"
```

### 2. Frontend Calls Service
```typescript
const result = await runAIAgentAudit({
  mode: "url",
  content: "https://example.com",
  model: "claude"
});
```

### 3. Netlify Function Processes Request
```typescript
// Validate request
// Route to Claude handler
// Build comprehensive prompt:
const systemPrompt = `
You are an expert accessibility auditor...
1. Use axe-core MCP tool for automated tests
2. Use wcag-docs MCP tool for criterion reference
3. Apply heuristic evaluation...
`;
```

### 4. AI Model Analysis (Current - Without MCP Tools)

**Current State**:
```typescript
const response = await client.messages.create({
  model: "claude-3-5-sonnet-20241022",
  messages: [{ role: "user", content: userPrompt }]
});
```

**Future State (With MCP Tools)**:
```typescript
const response = await client.messages.create({
  model: "claude-3-5-sonnet-20241022",
  messages: [{ role: "user", content: userPrompt }],
  tools: [
    fetchUrlTool,
    analyzeHtmlTool,
    getWcagCriterionTool,
    // ...
  ]
});
```

### 5. Result Processing
```typescript
// Parse AI response
// Extract violations and insights
// Structure as AuditResult
// Return to frontend
```

### 6. Frontend Displays Results
```typescript
// AuditResults component renders
// WCAG categorization by principle/severity
// Remediation guidance
// Links to documentation
```

## MCP Tools Integration (Future)

### Current Limitation
Claude API does not yet support MCP tool calling directly. The MCP servers are ready but not integrated.

### Integration Options

#### Option 1: Claude API MCP Support (Waiting)
When Anthropic adds MCP support to their API:
```typescript
const client = new Anthropic({ 
  apiKey,
  mcpServers: [
    { name: "fetch", command: "python", args: ["fetch-server/server.py"] },
    { name: "wcag", command: "python", args: ["wcag-docs-server/server.py"] },
    { name: "axe", command: "python", args: ["axe-core-server/server.py"] }
  ]
});
```

#### Option 2: Custom stdio Bridge
Create a custom bridge that:
1. Spawns MCP servers as child processes
2. Manages stdio communication
3. Wraps as Claude API tools
4. Routes tool calls to MCP servers

```typescript
// Pseudo-code
const mcpBridge = new MCPStdioBridge();
await mcpBridge.start("fetch-server", "python", ["server.py"]);
await mcpBridge.start("wcag-docs-server", "python", ["server.py"]);
await mcpBridge.start("axe-core-server", "python", ["server.py"]);

const tools = mcpBridge.toClaudeTools();
const response = await client.messages.create({
  model: "claude-3-5-sonnet",
  tools,
  messages: [...]
});
```

#### Option 3: Direct Tool Calls
Call MCP servers directly from function, send results to Claude:
```typescript
// Fetch page
const html = await fetch(url).then(r => r.text());

// Run axe-core
const axeResults = await runAxeServer(html);

// Get WCAG docs
const wcagDocs = await getWcagDocs(["1.1.1", "1.4.3"]);

// Send to Claude for heuristic analysis
const prompt = `
Axe-core found these issues:
${JSON.stringify(axeResults)}

WCAG criteria:
${wcagDocs}

Provide additional heuristic insights...
`;
```

## Hybrid Approach Benefits

### Quick Mode (Client-side axe-core)
- ✅ Instant results (< 3 seconds)
- ✅ No API costs
- ✅ Works offline
- ✅ Good for rapid iteration
- ⚠️  Limited to automated rules
- ⚠️  No heuristic evaluation
- ⚠️  CORS limitations on URLs

### Agent Mode (AI + MCP Tools)
- ✅ Comprehensive analysis (30-60 seconds)
- ✅ Heuristic evaluation
- ✅ Context-aware insights
- ✅ Natural language explanations
- ✅ Learning from WCAG docs
- ✅ Server-side analysis (no CORS)
- ⚠️  API costs
- ⚠️  Requires API keys
- ⚠️  Slower results

## Configuration

### Development
```bash
# .env.local
VITE_NETLIFY_FUNCTIONS_URL=http://localhost:8888/.netlify/functions
ANTHROPIC_API_KEY=sk-ant-...
```

### Production (Netlify)
```bash
# Netlify Environment Variables
ANTHROPIC_API_KEY=sk-ant-...
```

### MCP Server Setup
```bash
# Install dependencies
cd mcp-servers/fetch-server && pip install -r requirements.txt
cd mcp-servers/wcag-docs-server && pip install -r requirements.txt
cd mcp-servers/axe-core-server && pip install -r requirements.txt

# Install Playwright browser
python -m playwright install chromium
```

## Testing

### Test MCP Servers
```bash
cd mcp-servers
python test_servers.py
```

### Test Netlify Function Locally
```bash
netlify dev
# Navigate to http://localhost:8888/.netlify/functions/ai-agent-audit
```

### Test Frontend Integration
1. Enable Agent Mode toggle
2. Select model (Claude)
3. Enter test URL/HTML
4. Verify results display correctly

## Future Enhancements

### Short Term
- [ ] Complete MCP tools integration (Option 2 or 3)
- [ ] Add Gemini support
- [ ] Add GPT-4 support
- [ ] Expand WCAG docs database (all Level AA criteria)
- [ ] Add result caching to reduce API calls

### Medium Term
- [ ] Multi-page site crawling and analysis
- [ ] Historical audit comparison
- [ ] Custom ruleset configuration
- [ ] Automated fix suggestions with code examples

### Long Term
- [ ] Visual regression testing
- [ ] Automated fix application
- [ ] Continuous monitoring integration
- [ ] Team collaboration features

## Architecture Decisions

### Why Netlify Functions?
- Serverless execution (no infrastructure management)
- Automatic scaling
- Seamless Netlify deployment
- Environment variable management
- Built-in CORS handling

### Why MCP Servers?
- Standardized tool protocol
- Language agnostic (Python for complex analysis)
- Reusable across AI models
- Isolated execution environments
- Easy to test and debug

### Why Hybrid Approach?
- Best of both worlds (speed + depth)
- User choice based on needs
- Graceful degradation if AI unavailable
- Cost optimization (free tier for quick checks)
- Progressive enhancement

## Performance Optimization

### Caching Strategy
```typescript
// Cache WCAG docs locally
// Cache axe-core results for 5 minutes
// Deduplicate concurrent requests
```

### Parallel Execution
```typescript
// Run multiple MCP tools in parallel
const [fetchResult, wcagDocs] = await Promise.all([
  fetchUrl(url),
  getWcagDocs(["1.1.1", "1.4.3", "2.1.1"])
]);
```

### Streaming Results
```typescript
// Stream AI response as it generates
// Show progress indicators
// Early partial results display
```

## Security Considerations

- API keys stored in environment variables only
- No API keys in client-side code
- CORS configured for production domain only
- Input validation and sanitization
- Rate limiting on Netlify Functions
- MCP servers run in isolated processes

## Monitoring

### Key Metrics
- AI audit success rate
- Average audit duration
- API cost per audit
- Error rates by model
- MCP tool execution times

### Logging
```typescript
// Log audit requests (no sensitive data)
// Log AI model responses (summary only)
// Log MCP tool calls and results
// Log errors with stack traces
```

## Troubleshooting

### "AI Agent mode not available"
- Check `ANTHROPIC_API_KEY` is set
- Verify Netlify Function deployment
- Check network connectivity

### "MCP tools failed"
- Verify Python dependencies installed
- Check Playwright browser installed
- Review MCP server logs

### "Analysis timeout"
- Check large HTML content size
- Verify API rate limits
- Review Netlify Function timeout (default 10s)

## Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [Anthropic API](https://docs.anthropic.com/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
