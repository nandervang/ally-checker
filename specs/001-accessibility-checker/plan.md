# Implementation Plan: Accessibility Checker Application

**Branch**: `001-accessibility-checker` | **Date**: 2025-12-30 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-accessibility-checker/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

The Accessibility Checker Application provides developers and content managers with a comprehensive tool to analyze HTML content for WCAG 2.2 AA, EAA, and Swedish Lag (2018:1937) compliance. Users can submit URLs, complete HTML documents, or code snippets for analysis. The system employs a hybrid approach combining axe-core for automated checks and AI-powered heuristic analysis for subjective accessibility concerns. Results are organized by the four WCAG principles (Perceivable, Operable, Understandable, Robust) with detailed remediation guidance.

**Technical Approach**: Single-page application built with Bun + Vite, React 19 + TypeScript, and ShadCN 2.0 with Material Design 3 tokens. Backend services powered by Supabase for persistence and authentication. Python-based microservice for ETU report generation. MCP servers for web content fetching and WCAG documentation search.

## Technical Context

**Language/Version**: 
- Frontend: TypeScript 5.3+, React 19+
- Backend: Bun 1.3+ runtime
- Report Service: Python 3.11+

**Primary Dependencies**:
- **Frontend**: React 19, ShadCN 2.0, Tailwind CSS 4.0, axe-core 4.8+
- **Build**: Bun, Vite 5+
- **Backend**: Supabase JS Client, Supabase Realtime
- **Report Service**: python-docx, PydanticAI, FastAPI
- **AI**: OpenAI SDK / Anthropic SDK (for heuristic analysis)
- **MCP Servers**: Fetch MCP (web content), WCAG Documentation MCP, Supabase MCP

**Storage**: 
- Supabase PostgreSQL (audit reports, accessibility issues, user sessions)
- Client-side: localStorage for user preferences

**Testing**:
- Frontend: Vitest, @testing-library/react, axe-core (accessibility testing)
- Backend: Bun test
- Report Service: pytest
- E2E: Playwright

**Target Platform**: 
- Modern web browsers (Chrome 100+, Firefox 100+, Safari 16+, Edge 100+)
- Desktop-optimized, responsive design
- Server: Node.js-compatible runtime (Bun)
- Report Service: Linux server (Docker container)

**Project Type**: Web application (frontend + backend services)

**Performance Goals**:
- HTML snippet analysis: < 5 seconds
- Full document analysis: < 30 seconds
- URL fetch + analysis: < 45 seconds total
- Report generation: < 10 seconds for typical 20-issue audit
- UI responsiveness: < 100ms for all interactions
- Lighthouse accessibility score: ≥ 95

**Constraints**:
- WCAG 2.2 AA compliance mandatory (zero critical violations)
- Minimum 18px base font size throughout UI
- Minimum 44x44px touch targets for all interactive elements
- 4.5:1 color contrast ratio for normal text, 3:1 for large text
- Full keyboard navigation support with 3px visible focus indicators
- Swedish (sv-SE) and English (en-US) localization required
- No JavaScript-rendered content analysis (static HTML only)
- URL fetching respects robots.txt and rate limits

**Scale/Scope**:
- Initial launch: 100 concurrent users
- HTML document size: up to 100KB
- Analysis results: up to 500 issues per audit
- Supabase free tier limits: 500MB database, 2GB bandwidth/month
- Report generation: 10 reports/hour initially

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Legal Accessibility Compliance ✅
- **WCAG 2.2 AA**: UI components will use ShadCN 2.0 + M3 tokens with built-in WCAG compliance. Automated testing with axe-core ensures zero violations.
- **EAA Compliance**: Focus on digital service accessibility aligns with EAA requirements for EU market.
- **Swedish Lag (2018:1937)**: Accessibility statement will be generated as part of project documentation. Audit logic validates against same WCAG standards referenced by Swedish law.

### II. Beads for Task Tracking ✅
- **Compliance**: All development work tracked via `bd` CLI (already established with ally-checker-6ub issue).
- **No Markdown TODOs**: Code comments will not contain task tracking; all tracked in Beads.

### III. Enhanced Accessibility UI Standards ✅
- **ShadCN 2.0 + M3**: Vega style preset provides Google Material Design 3 aesthetic.
- **18px+ Fonts**: Base font size set to 18px in Tailwind configuration.
- **44x44px Touch Targets**: All buttons, inputs, and interactive elements sized appropriately.
- **Keyboard Accessibility**: Full navigation support with visible focus rings (3px, 3:1 contrast).
- **Swedish Localization**: i18next configured for sv-SE and en-US.

### IV. Test-Driven Development ✅
- **TDD Workflow**: Tests written before implementation for all features.
- **Accessibility Testing**: @testing-library with accessibility queries, axe-core automated checks, manual keyboard/screen reader testing.

### V. TypeScript-First with Bun Runtime ✅
- **TypeScript**: Strict mode enabled, comprehensive type coverage.
- **Bun**: Primary runtime for dev server, testing, and production builds.

### Technology Stack Compliance ✅
- ✅ Bun runtime
- ✅ React 19 + TypeScript
- ✅ ShadCN 2.0 with M3 tokens (Vega preset)
- ✅ Tailwind CSS 4.0
- ✅ Beads CLI for task management
- ✅ axe-core + Lighthouse testing

**GATE STATUS**: ✅ PASS - All constitutional requirements satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/001-accessibility-checker/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── api.openapi.yaml
│   └── report-service.openapi.yaml
├── checklists/          # Quality validation
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
# Web Application Structure
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # ShadCN 2.0 components (Button, Card, Input, etc.)
│   │   ├── layout/          # Layout components (Header, Main, Footer)
│   │   ├── input/           # Input area components (HTMLInput, URLInput, IssueInput)
│   │   ├── analysis/        # Analysis display (LoadingState, ErrorDisplay)
│   │   └── report/          # Report components (WCAGPrincipleSection, IssueList, IssueCard)
│   ├── lib/
│   │   ├── accessibility/   # axe-core integration, AI heuristic analysis
│   │   ├── supabase/        # Supabase client, database operations
│   │   ├── mcp/             # MCP server clients (Fetch, WCAG docs)
│   │   ├── i18n/            # Internationalization (sv-SE, en-US)
│   │   └── utils/           # Utility functions (cn, formatting, validation)
│   ├── hooks/               # Custom React hooks (useAnalysis, useSupabase)
│   ├── pages/               # Page components (Home, AnalysisResults)
│   ├── styles/              # Global styles, M3 tokens, Tailwind config
│   ├── types/               # TypeScript type definitions
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Entry point
├── public/                  # Static assets
├── tests/
│   ├── unit/                # Component tests
│   ├── integration/         # Integration tests
│   ├── accessibility/       # Accessibility tests (axe-core)
│   └── e2e/                 # End-to-end tests (Playwright)
├── vite.config.ts
├── tailwind.config.ts       # Tailwind 4.0 + M3 tokens
├── tsconfig.json
├── components.json          # ShadCN configuration
└── package.json

backend/
├── supabase/
│   ├── migrations/          # Database migrations
│   │   ├── 001_create_audits_table.sql
│   │   ├── 002_create_issues_table.sql
│   │   └── 003_create_user_sessions.sql
│   ├── functions/           # Edge functions (if needed)
│   └── config.toml          # Supabase configuration
└── mcp-servers/
    ├── fetch/               # Web content fetching MCP
    ├── wcag-docs/           # WCAG documentation search MCP
    └── supabase-schema/     # Supabase schema management MCP

report-service/
├── src/
│   ├── main.py              # FastAPI application
│   ├── models/
│   │   ├── audit_report.py  # Pydantic models for reports
│   │   └── etu_format.py    # ETU-specific report structure
│   ├── services/
│   │   ├── report_generator.py  # python-docx report generation
│   │   └── ai_summarizer.py     # PydanticAI report summarization
│   ├── templates/
│   │   └── etu_report_template.docx
│   └── api/
│       └── routes.py        # API endpoints
├── tests/
│   ├── test_report_generation.py
│   └── test_api.py
├── requirements.txt
├── Dockerfile
└── pyproject.toml

# Root configuration
├── .env.example             # Environment variables template
├── .env.local               # Local environment (gitignored)
├── docker-compose.yml       # Docker setup for report service
├── bun.lockb                # Bun lock file
└── README.md                # Project documentation
```

**Structure Decision**: Web application architecture with separate frontend and backend concerns. Frontend handles UI and client-side analysis (axe-core), Supabase manages persistence and auth, Python microservice generates Word reports. This separation allows independent scaling of report generation and maintains clean boundaries between presentation, business logic, and document generation.
