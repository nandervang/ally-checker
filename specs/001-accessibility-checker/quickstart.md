# Quickstart Guide: Accessibility Checker

**Feature**: 001-accessibility-checker  
**Last Updated**: 2025-12-30

## Overview

This guide helps developers set up and run the Accessibility Checker application locally. The app analyzes HTML content for WCAG 2.2 AA compliance using axe-core and AI heuristics.

## Prerequisites

- **Bun** 1.3+ ([installation guide](https://bun.sh/docs/installation))
- **Docker** & Docker Compose (for report service)
- **Python** 3.11+ (for report service development)
- **Supabase CLI** ([installation](https://supabase.com/docs/guides/cli))
- **Git** for version control

## Quick Start (5 minutes)

### 1. Clone and Install

```bash
# Clone repository
git clone https://github.com/nandervang/ally-checker.git
cd ally-checker

# Switch to feature branch
git checkout 001-accessibility-checker

# Install frontend dependencies with Bun
cd frontend
bun install
```

### 2. Set Up Supabase

```bash
# Initialize Supabase locally
supabase init

# Start local Supabase (PostgreSQL, Auth, Realtime)
supabase start

# Apply database migrations
supabase db reset

# Get local Supabase credentials (copy these!)
supabase status
```

Expected output:
```
API URL: http://localhost:54321
anon key: eyJhbGc...
service_role key: eyJhbGc...
```

### 3. Configure Environment

```bash
# Create frontend/.env.local
cat > frontend/.env.local << EOF
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<your-anon-key-from-step-2>
VITE_REPORT_SERVICE_URL=http://localhost:8000
VITE_OPENAI_API_KEY=<your-openai-key>  # For AI heuristics
EOF
```

### 4. Start Frontend

```bash
cd frontend
bun run dev
```

Frontend now running at **http://localhost:5173** ✅

### 5. Start Report Service (Optional)

```bash
# From repo root
cd report-service

# Build and run with Docker Compose
docker-compose up --build

# Or run locally with Python
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```

Report service now running at **http://localhost:8000** ✅

### 6. Verify Setup

Open **http://localhost:5173** and:
1. Paste this HTML snippet:
   ```html
   <img src="cat.jpg">
   ```
2. Click **"Analyze"** button
3. See accessibility issues appear in WCAG categories

Expected result: "Image missing alt attribute" under Perceivable principle.

---

## Project Structure

```
ally-checker/
├── frontend/              # React + TypeScript + ShadCN
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── lib/           # axe-core, Supabase, MCP clients
│   │   ├── hooks/         # Custom React hooks
│   │   └── App.tsx
│   ├── vite.config.ts
│   └── package.json
├── backend/
│   └── supabase/          # Database migrations & functions
│       └── migrations/
├── report-service/        # Python microservice
│   ├── src/
│   │   ├── main.py        # FastAPI app
│   │   └── services/      # Report generation
│   └── Dockerfile
└── specs/
    └── 001-accessibility-checker/
        ├── spec.md        # Feature specification
        ├── plan.md        # This implementation plan
        └── contracts/     # API contracts
```

---

## Development Workflow

### Running Tests

```bash
# Frontend tests (Vitest + Testing Library)
cd frontend
bun test

# Accessibility tests
bun test:a11y

# E2E tests (Playwright)
bun test:e2e

# Report service tests
cd report-service
pytest
```

### Database Migrations

```bash
# Create new migration
supabase migration new <migration-name>

# Apply migrations
supabase db reset

# Generate TypeScript types from schema
supabase gen types typescript --local > frontend/src/types/database.types.ts
```

### Adding ShadCN Components

```bash
cd frontend

# Add button component
bun x shadcn@latest add button

# Add card component
bun x shadcn@latest add card

# List all available components
bun x shadcn@latest list
```

### Code Formatting

```bash
# Frontend (Prettier + ESLint)
cd frontend
bun run format
bun run lint

# Report service (Black + Ruff)
cd report-service
black src/
ruff check src/
```

---

## Common Tasks

### Analyze HTML Snippet

```typescript
// In browser console or component
const result = await analyzeHTML({
  input_type: 'html_snippet',
  input_content: '<button>Click</button>',
  session_id: sessionId
});

console.log(result.issues);  // Array of accessibility issues
```

### Fetch and Analyze URL

```typescript
const result = await analyzeURL({
  input_type: 'url',
  url: 'https://example.com',
  session_id: sessionId
});
```

### **[NEW]** Configure Report Template

```typescript
// User can select from 5 professional report templates
import { updateSettings } from '@/services/settingsService';

// ETU Swedish - Professional Swedish accessibility reports
await updateSettings({ defaultReportTemplate: 'etu-swedish' });

// WCAG International - International standard format (default)
await updateSettings({ defaultReportTemplate: 'wcag-international' });

// VPAT US - Section 508 federal compliance format
await updateSettings({ defaultReportTemplate: 'vpat-us' });

// Simple - Concise format with before/after code
await updateSettings({ defaultReportTemplate: 'simple' });

// Technical - Detailed technical analysis
await updateSettings({ defaultReportTemplate: 'technical' });
```

### **[NEW]** View Testing Instructions

Each accessibility issue includes comprehensive testing instructions following Magenta A11y format:

```typescript
// Issue includes these testing fields:
{
  how_to_reproduce: "Step-by-step reproduction instructions",
  keyboard_testing: "Keyboard-only testing procedures",
  screen_reader_testing: "Screen reader testing instructions",
  visual_testing: "Visual verification steps",
  expected_behavior: "Description of correct accessible behavior",
  report_text: "Formatted report text (ETU/WCAG/VPAT/Simple/Technical)"
}
```

In the UI:
1. Each issue card displays collapsible accordion sections for testing
2. Click "How to Reproduce" to see reproduction steps
3. Click "Keyboard Testing" to see keyboard-specific tests
4. Click "Screen Reader Testing" to see screen reader instructions
5. Click "Visual Testing" to see visual verification steps
6. Click "Expected Behavior" to see correct behavior description
7. Click "Report Text" section to view formatted report (with copy button)

### Generate Report

```typescript
const response = await fetch('http://localhost:8000/api/reports/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Report-Service-Key': process.env.REPORT_SERVICE_KEY
  },
  body: JSON.stringify({
    audit_id: auditId,
    audit_data: auditData,
    template: 'etu-standard'
  })
});

const blob = await response.blob();
downloadFile(blob, 'report.docx');
```

---

## Configuration

### Tailwind + M3 Tokens

```typescript
// tailwind.config.ts
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontSize: {
        base: '18px',  // Constitutional requirement
      },
      spacing: {
        'touch-target': '44px',  // WCAG 2.2 AA requirement
      },
      colors: {
        // Material Design 3 tokens (Vega preset)
        primary: 'var(--md-sys-color-primary)',
        'on-primary': 'var(--md-sys-color-on-primary)',
        // ... more M3 color roles
      }
    }
  }
};
```

### ShadCN Configuration

```json
// components.json
{
  "style": "vega",
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles/globals.css",
    "baseColor": "neutral"
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### Supabase Configuration

```toml
# supabase/config.toml
[api]
enabled = true
port = 54321
max_rows = 1000

[db]
port = 54322
shadow_port = 54320

[auth]
enabled = true
site_url = "http://localhost:5173"
additional_redirect_urls = []
```

---

## Troubleshooting

### Frontend won't start
```bash
# Clear Bun cache
rm -rf node_modules bun.lockb
bun install

# Check Bun version
bun --version  # Should be 1.3+
```

### Supabase connection errors
```bash
# Restart Supabase
supabase stop
supabase start

# Check status
supabase status
```

### axe-core analysis fails
- Check browser console for errors
- Verify HTML is valid (not malformed)
- Check HTML size (< 100KB limit)

### Report generation fails
```bash
# Check Docker logs
docker-compose logs report-service

# Verify API key in request headers
curl -H "X-Report-Service-Key: test-key" http://localhost:8000/health
```

### Type errors after schema changes
```bash
# Regenerate TypeScript types from Supabase
supabase gen types typescript --local > frontend/src/types/database.types.ts
```

---

## Next Steps

- **Read the full spec**: [spec.md](spec.md)
- **Review the plan**: [plan.md](plan.md)
- **Check API contracts**: [contracts/](contracts/)
- **Run `/speckit.tasks`** to generate implementation tasks
- **Track work via Beads**: `bd ready` to find tasks

---

## Resources

- [Bun Documentation](https://bun.sh/docs)
- [React 19 Docs](https://react.dev)
- [ShadCN UI](https://ui.shadcn.com)
- [Supabase Docs](https://supabase.com/docs)
- [axe-core GitHub](https://github.com/dequelabs/axe-core)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Material Design 3](https://m3.material.io)

---

## Support

For questions or issues:
1. Check this quickstart first
2. Review specification in [spec.md](spec.md)
3. Create Beads issue: `bd create --title "Question: <topic>"`
4. Check project constitution: `.specify/memory/constitution.md`
