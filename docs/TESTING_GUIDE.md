# Comprehensive Testing Guide

This guide covers how to test the entire Ally Checker application, including the frontend UI, backend Netlify Functions, MCP tools, and automated accessibility checks.

## 1. Environment Setup

Before testing, ensure your environment variables are configured.

### Local Development (`.env.local`)
Required for running the frontend and connecting to services.

```bash
# AI Service
GEMINI_API_KEY=your_key_here

# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Reporting
VITE_REPORT_SERVICE_KEY=dev_secret
```

### Functions Environment (`.env`)
Required for Netlify Functions (the backend for MCP tools).

```bash
REPORT_SERVICE_KEY=dev_secret
```

---

## 2. Running the Full Stack

To test the application as it behaves in production (Frontend + Functions + MCP Tools), use the Netlify CLI.

```bash
# Starts Frontend (localhost:8888) and Functions
netlify dev
```

**What to test manually:**
1.  **Audit**: Enter a URL like `https://example.com`. Verify that the AI agent runs, identifies accessibility issues, and produces a report.
2.  **Authentication**: Sign in/out (if configured via Supabase).
3.  **Collections**: Select issues from an audit and save them to a collection.
4.  **Reports**: Click "Generate Report" and verify the PDF/HTML download works.

---

## 3. Automated Testing Suites

We have three layers of automated tests.

### A. Unit Tests (Frontend & Logic)
Tests individual React components, utility functions, and hooks.

```bash
# Run all unit tests once
bun test:run

# Run in watch mode (for development)
bun test
```

*   **Location**: `src/**/*.test.ts`, `src/**/*.test.tsx`
*   **Coverage**: Components (`<Button />`, `<Card />`), Services (`axeService`, `collectionService`), Utils.

### B. MCP Tool Verification (Backend Logic)
Tests the 19 registered MCP tools (the "brain" of the AI agent). This verifies the tools are correctly defined and can connect to external services (W3C, etc.).

```bash
bun scripts/test-mcp-tools.ts
```

*   **Location**: `netlify/functions/lib/mcp-tools/`
*   **Coverage**: Tool definitions, schema validation, database lookups (WCAG/WAI/Magenta), basic network fetching.

### C. End-to-End (E2E) Tests
Tests complete user flows in a real browser using Playwright.

```bash
# Run all E2E tests (headless)
bun test:e2e

# Run with UI (to see the browser)
bun test:e2e --ui
```

*   **Location**: `e2e/*.spec.ts`
*   **Coverage**: Critical paths like loading the app, running a screenshot verification, etc.

---

## 4. Special Verification Scripts

### Contrast Check
Verifies that our design tokens meets WCAG AAA contrast requirements.

```bash
bun scripts/check-contrast.ts
```

### Document Accessibility (Python)
The `audit_pdf` and `audit_docx` tools use a Python backend. To test these in isolation (without the Node.js wrapper):

```bash
cd mcp-servers/document-accessibility-server
# Install dependencies first
pip install -r requirements.txt
# Run the CLI directly
python3 cli.py audit_pdf /path/to/test.pdf
```

## 5. Troubleshooting Common Issues

*   **"Gemini API Error"**: Check `GEMINI_API_KEY` in `.env.local`. Rate limits may apply.
*   **"Tool not found"**: Ensure you are running via `netlify dev` so functions are loaded. `bun dev` only runs the frontend.
*   **"Python spawn error"**: Ensure python3 is in your path if running document audits locally, or verify the bundling settings in `netlify.toml` for production.
