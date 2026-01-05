# Ally Checker - AI-Powered Accessibility Auditing

WCAG 2.2 Level AA compliance checker powered by Gemini AI with MCP tools integration.

## Features

- 🤖 **AI-Powered Analysis**: Gemini 2.0 Flash with enhanced system prompt
- 🔧 **MCP Tools Integration**: Fetch server for URL retrieval, WCAG Docs for criterion details
- ⚡ **axe-core Integration**: Automated accessibility testing
- 📊 **Comprehensive Coverage**: Systematic WCAG 2.2 AA compliance checking
- 🎯 **Smart Input Processing**: Handles URLs, full HTML pages, and component snippets
- 📦 **Chunking Support**: Automatically handles large HTML inputs

## Quick Start

### Installation

```bash
bun install
```

### Environment Variables

Create a `.env.local` file:

```bash
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

```bash
bun dev
```

### Production

```bash
bun start
```

## AI System Prompt

The Gemini AI agent uses an enhanced system prompt that includes:

- **MCP Tools Documentation**: Fetch server and WCAG Docs server integration
- **Input Processing Guidance**: URL, HTML document, and component snippet handling
- **Systematic WCAG Coverage**: All 4 principles (Perceivable, Operable, Understandable, Robust)
- **Analysis Methodology**: Automated vs manual checks distinction
- **Severity Classification**: Critical, serious, moderate, minor

See [SYSTEM_PROMPT_ENHANCED.md](SYSTEM_PROMPT_ENHANCED.md) for full documentation.

## Input Types

### 1. URL Audit
```typescript
{ input_type: 'url', input_value: 'https://example.com' }
```
Uses MCP Fetch to retrieve live page content.

### 2. HTML Document
```typescript
{ input_type: 'html', input_value: '<html>...</html>' }
```
Analyzes complete HTML markup. Automatically chunks large documents.

### 3. Component Snippet
```typescript
{ 
  input_type: 'snippet', 
  input_value: 'Issue description',
  suspected_issue: 'Context'
}
```
Focuses on specific component accessibility.

## Architecture

- **Frontend**: React + TypeScript + Tailwind + shadcn/ui
- **Backend**: Bun server with Supabase
- **AI**: Gemini 2.0 Flash Exp
- **MCP Servers**: Fetch, WCAG Docs
- **Testing**: axe-core integration

## References

- [Swedish Accessibility Guide](ACCESSIBILITY_AGENT_SETUP_GUIDE_v5.md) - Systematic WCAG coverage patterns
- [Enhanced System Prompt](SYSTEM_PROMPT_ENHANCED.md) - AI prompt documentation

Built with [Bun](https://bun.com) v1.3.5
