# Testing Flow Agent for A11y Checker

## Overview

This E2E test suite validates the complete accessibility checker workflow including:

- ✅ All input modes (URL, HTML, Snippet)
- ✅ Scan results and issue detection
- ✅ Tools used verification (axe-core, AI analysis)
- ✅ WCAG compliance reporting
- ✅ Issue categorization and severity classification
- ✅ Remediation information

## Test Coverage

The `testing-flow.spec.ts` file includes the following tests:

1. **Sanity Check** - Verifies application loads and UI is interactive
2. **URL Mode Workflow** - Tests scanning of external websites
3. **Snippet Mode Workflow** - Tests analysis of code snippets with known issues
4. **HTML Mode Workflow** - Tests analysis of full HTML documents
5. **Tools Attribution** - Verifies tool usage information is displayed
6. **WCAG Categorization** - Validates issues are categorized by WCAG principles
7. **Severity Classification** - Checks severity levels (Critical, Serious, Moderate, Minor)
8. **Issue Details** - Verifies detailed remediation information is available
9. **Summary Metrics** - Validates summary statistics are displayed
10. **New Audit Workflow** - Tests ability to start a new audit after completion

## Running the Tests

### Prerequisites

1. Install dependencies:
```bash
bun install
```

2. Install Playwright browsers:
```bash
bunx playwright install chromium
```

3. Set up environment variables (create `.env.local`):
```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=test-anon-key
VITE_REPORT_SERVICE_KEY=test-service-key
GEMINI_API_KEY=test-gemini-api-key
```

### Run All Testing Flow Tests

```bash
bun run test:e2e e2e/testing-flow.spec.ts
```

Or with Playwright directly:

```bash
bunx playwright test e2e/testing-flow.spec.ts
```

### Run a Specific Test

```bash
bunx playwright test e2e/testing-flow.spec.ts -g "sanity check"
```

### Run with UI Mode (Interactive)

```bash
bunx playwright test e2e/testing-flow.spec.ts --ui
```

### Generate Test Report

```bash
bunx playwright test e2e/testing-flow.spec.ts --reporter=html
bunx playwright show-report
```

## Test Architecture

### Auth Bypass

The tests use a `bypassAuth()` helper function that sets `E2E_TEST_USER` in localStorage to bypass authentication for testing:

```typescript
async function bypassAuth(page: any) {
  await page.evaluate(() => {
    localStorage.setItem('E2E_TEST_USER', 'true');
  });
  await page.reload();
}
```

### Test Patterns

Each workflow test follows this pattern:
1. Bypass authentication
2. Navigate to appropriate tab (URL/HTML/Snippet)
3. Fill in test data with known accessibility issues
4. Submit for analysis
5. Wait for and verify results
6. Validate specific aspects (tools, severity, WCAG mapping)

### Known Test Issues

Test snippets are designed to trigger specific accessibility violations:

- **Missing alt text**: `<img src="test.jpg">` - triggers WCAG 1.1.1
- **Low contrast**: `style="color: #999; background: #999;"` - triggers WCAG 1.4.3
- **Missing labels**: `<input type="text">` - triggers WCAG 3.3.2

## Validation Points

The test suite validates:

### Tool Attribution
- Checks for mentions of axe-core
- Looks for methodology information
- Verifies tools used section

### WCAG Compliance
- Validates principles: Perceivable, Operable, Understandable, Robust
- Checks for success criterion numbers (e.g., 1.1.1, 1.4.3)
- Verifies conformance level (A, AA, AAA)

### Issue Quality
- Title and description presence
- Element HTML and selector
- How to fix / remediation steps
- WCAG documentation links

### Severity Levels
- Critical - Must fix immediately
- Serious - High priority fixes
- Moderate - Should fix
- Minor - Nice to fix

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

```yaml
- name: Run E2E Tests
  run: |
    bun install
    bunx playwright install chromium
    bun run test:e2e
```

## Troubleshooting

### Test Timeouts

If tests timeout, increase the timeout in playwright.config.ts:
```typescript
use: {
  timeout: 60000, // Increase from default
}
```

### Server Not Starting

Ensure no other process is using port 3456:
```bash
lsof -ti:3456 | xargs kill -9
```

### Auth Issues

If E2E_TEST_USER bypass isn't working, check the auth context implementation in `src/contexts/AuthContext.tsx`.

## Future Enhancements

- [ ] Add screenshot comparison tests
- [ ] Test report generation functionality
- [ ] Validate accessibility statement generation
- [ ] Test issue collection features
- [ ] Add performance benchmarks
- [ ] Test document upload (PDF, DOCX)
- [ ] Validate real-time updates via Supabase

## Related Documentation

- [Playwright Configuration](../playwright.config.ts)
- [Other E2E Tests](./example.spec.ts)
- [Main README](../README.md)
