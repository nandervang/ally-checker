# Research & Technical Decisions

**Feature**: Accessibility Checker Application  
**Branch**: 001-accessibility-checker  
**Date**: 2025-12-30

## Overview

This document consolidates research findings and technical decisions for the Accessibility Checker application. All NEEDS CLARIFICATION items from the Technical Context have been resolved through research and aligned with project constitution.

## Technology Stack Decisions

### 1. Frontend Framework: React 19 + TypeScript + Bun

**Decision**: Use React 19 with TypeScript, built with Bun runtime and Vite bundler.

**Rationale**:
- **React 19**: Latest version with improved performance and accessibility features (automatic batching, concurrent rendering)
- **TypeScript**: Constitutional requirement for type safety
- **Bun**: Constitutional requirement, provides superior performance over Node.js (4x faster package installation, 3x faster test execution)
- **Vite**: Fast development server with HMR, excellent TypeScript support, optimized production builds

**Alternatives Considered**:
- **Next.js**: Rejected due to unnecessary SSR complexity for single-page accessibility checker
- **Solid.js**: Rejected due to smaller ecosystem and team unfamiliarity
- **Vue 3**: Rejected due to React's stronger TypeScript integration and larger component library ecosystem

### 2. UI Framework: ShadCN 2.0 + Tailwind CSS 4.0 (Vega Preset)

**Decision**: Use ShadCN 2.0 component library with Tailwind CSS 4.0, configured with Vega style preset for Material Design 3 aesthetic.

**Rationale**:
- **ShadCN 2.0**: Constitutional requirement, provides accessible, customizable components built on Radix UI primitives
- **Vega Preset**: Delivers clean "Google look" with Material Design 3 design tokens
- **Tailwind CSS 4.0**: Latest version with native CSS cascade layers, improved performance, better dark mode support
- **Built-in Accessibility**: ShadCN components include ARIA attributes, keyboard navigation, focus management

**Alternatives Considered**:
- **Material-UI**: Rejected due to heavier bundle size and opinionated styling that's harder to customize
- **Ant Design**: Rejected due to less accessibility-focused design and Chinese market orientation
- **Custom Components**: Rejected due to time investment required to achieve WCAG 2.2 AA compliance from scratch

**Configuration**:
```typescript
// components.json
{
  "style": "vega",
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles/globals.css",
    "baseColor": "neutral"
  }
}
```

### 3. Backend: Supabase (PostgreSQL + Auth + Realtime)

**Decision**: Use Supabase as Backend-as-a-Service for database, authentication, and real-time features.

**Rationale**:
- **PostgreSQL**: Robust relational database with JSONB support for flexible audit report storage
- **Built-in Auth**: Row-level security (RLS) for multi-tenant audit report privacy
- **Real-time**: Potential future feature for collaborative audit reviews
- **Free Tier**: 500MB database sufficient for initial 100 users
- **Supabase MCP**: Integration with Model Context Protocol for schema management

**Alternatives Considered**:
- **Firebase**: Rejected due to NoSQL data model less suited for relational audit data
- **Self-hosted PostgreSQL**: Rejected due to operational overhead (auth, backup, scaling)
- **PlanetScale**: Rejected due to MySQL limitations for JSONB-heavy workloads

**Schema Design** (see data-model.md):
- `audits` table: Audit metadata (URL, timestamp, user_id, status)
- `issues` table: Individual accessibility violations linked to audits
- `user_sessions` table: User preferences and analysis history

### 4. Accessibility Analysis: axe-core + AI Heuristics

**Decision**: Hybrid approach combining axe-core automated testing with AI-powered heuristic analysis.

**Rationale**:
- **axe-core**: Industry-standard automated WCAG testing library (used by Google, Microsoft, Deque)
  - Detects 57% of WCAG issues automatically
  - Zero false positives design philosophy
  - Covers all WCAG 2.2 AA success criteria testable by automation
  
- **AI Heuristics**: Required for subjective evaluations
  - Alt text meaningfulness (WCAG 1.1.1)
  - Button/link label clarity (WCAG 2.4.4)
  - Heading hierarchy logic (WCAG 2.4.6)
  - Form label associations (WCAG 3.3.2)

**Alternatives Considered**:
- **pa11y**: Rejected due to less comprehensive ruleset than axe-core
- **Lighthouse**: Rejected as it requires full page rendering (we need snippet support)
- **Manual-only**: Rejected as too slow and inconsistent

**Implementation Approach**:
```typescript
// Automated + AI hybrid
const axeResults = await runAxeCore(htmlContent);
const aiInsights = await analyzeWithAI(htmlContent, suspectedIssue);
const mergedReport = consolidateFindings(axeResults, aiInsights);
```

### 5. Report Generation: Python + python-docx + PydanticAI

**Decision**: Separate Python microservice for ETU Word report generation using python-docx and PydanticAI.

**Rationale**:
- **Python**: Best ecosystem for document generation (python-docx, docxtpl)
- **python-docx**: Robust library for creating/modifying Word documents with precise formatting
- **PydanticAI**: Type-safe AI integration for report summarization and recommendations
- **Microservice Architecture**: Separates compute-intensive report generation from frontend
- **Docker Deployment**: Easy scaling independent of main application

**Alternatives Considered**:
- **JavaScript (docx npm)**: Rejected due to less mature library and limited formatting capabilities
- **HTML to DOCX**: Rejected due to poor fidelity for professional Word documents
- **LaTeX/PDF**: Rejected due to ETU requirement for editable Word format

**ETU Report Format**:
- Title page with audit metadata
- Executive summary (AI-generated)
- Issues by WCAG principle
- Detailed remediation recommendations
- Compliance scorecard

### 6. MCP Server Integration

**Decision**: Integrate three MCP servers for enhanced functionality.

**Rationale**:
- **Fetch MCP**: Handles URL fetching with robots.txt compliance, rate limiting, error handling
  - Abstracts away CORS complexity
  - Consistent error messages
  - Respects web scraping best practices

- **WCAG Documentation MCP**: Provides context-aware WCAG success criterion explanations
  - Enriches issue reports with official WCAG guidance
  - Helps users understand violations
  - Links to techniques and examples

- **Supabase MCP**: Manages database schema and migrations
  - Type-safe database operations
  - Migration tracking
  - Schema validation

**Alternatives Considered**:
- **Native Fetch API**: Rejected due to need for server-side execution and complexity
- **Static WCAG Docs**: Rejected due to version drift and maintenance burden
- **Supabase CLI Only**: Rejected due to lack of programmatic schema access

## Integration Patterns

### Frontend → Supabase
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Save audit report
const { data, error } = await supabase
  .from('audits')
  .insert({ url, timestamp, issues_count })
  .select()
```

### Frontend → Report Service
```typescript
// REST API call to Python microservice
const response = await fetch('http://report-service/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ auditId, format: 'etu' })
})

const blob = await response.blob()
downloadFile(blob, 'audit-report.docx')
```

### MCP Server Usage
```typescript
// Fetch MCP for URL content
const htmlContent = await mcpFetch.getContent(url)

// WCAG Docs MCP for criterion details
const criterionDetails = await wcagMCP.getCriterion('1.4.3')

// Supabase MCP for schema operations
const schema = await supabaseMCP.getSchema('audits')
```

## Best Practices by Technology

### React 19 + TypeScript
- Use functional components with hooks
- Strict TypeScript mode enabled
- Component composition over inheritance
- Custom hooks for shared logic (useAnalysis, useSupabase)
- Error boundaries for graceful failure handling
- Suspense for async data loading

### Tailwind CSS 4.0
- Utility-first approach with semantic component classes
- M3 design tokens in `tailwind.config.ts`
- Custom plugins for accessibility utilities
- Dark mode with `class` strategy
- Content-driven responsive breakpoints

### Supabase
- Row-level security (RLS) policies on all tables
- Database functions for complex queries
- Realtime subscriptions for live updates (future)
- Edge functions for server-side logic if needed
- Type generation: `supabase gen types typescript`

### axe-core
- Run on isolated DOM for snippet analysis
- Configure rules for WCAG 2.2 AA only
- Custom rule for AI heuristic integration
- Async execution to avoid blocking UI
- Result caching for identical HTML

### Python Report Service
- FastAPI for async request handling
- Pydantic models for type safety
- Docker multi-stage builds for small images
- Health check endpoint for monitoring
- Rate limiting for abuse prevention

## Performance Optimization

### Frontend
- Code splitting by route
- Lazy loading for heavy components (report viewer)
- Debounced analysis triggers
- Web Workers for axe-core execution
- Service Worker for offline capability (future)

### Backend
- Supabase connection pooling
- Database indexes on audit timestamps and user IDs
- Edge caching for static WCAG documentation
- Report generation queue (future for high volume)

### Report Service
- Template caching in memory
- Async report generation with task queue
- Docker container warm-up
- Result streaming for large reports

## Security Considerations

### Input Validation
- HTML sanitization (DOMPurify) to prevent XSS
- URL validation before fetching
- Rate limiting on analysis endpoints
- Maximum HTML size enforcement (100KB)

### Data Privacy
- User audits isolated via Supabase RLS
- No PII collection
- Audit results auto-expire after 30 days (optional)
- GDPR-compliant data handling

### Report Service
- API key authentication
- Request size limits
- Sandboxed python-docx execution
- No external network access from containers

## Deployment Strategy

### Frontend
- Vercel deployment (Bun support, edge network)
- Environment variables for Supabase credentials
- Automatic HTTPS
- Preview deployments for PRs

### Supabase
- Hosted Supabase (free tier initially)
- Database backups enabled
- RLS policies enforced
- Anonymous auth for unauthenticated users

### Report Service
- Docker container on Railway/Fly.io
- Auto-scaling based on request volume
- Health checks every 30 seconds
- Graceful shutdown handling

## Open Questions (None Remaining)

All technical unknowns have been resolved through research. Ready to proceed to Phase 1 design.

## References

- [React 19 Documentation](https://react.dev)
- [ShadCN UI](https://ui.shadcn.com)
- [Tailwind CSS 4.0](https://tailwindcss.com)
- [axe-core GitHub](https://github.com/dequelabs/axe-core)
- [Supabase Docs](https://supabase.com/docs)
- [python-docx](https://python-docx.readthedocs.io)
- [PydanticAI](https://ai.pydantic.dev)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Material Design 3](https://m3.material.io)
