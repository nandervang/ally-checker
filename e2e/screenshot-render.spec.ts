
import { test, expect } from '@playwright/test';

// Define the mock result structure matching what the UI expects
const mockResultWithScreenshot = {
  url: "https://example.com",
  documentType: "html",
  timestamp: new Date().toISOString(),
  summary: {
    totalIssues: 1,
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 1,
    passed: 5,
    failed: 1,
  },
  issues: [
    {
      id: "issue-screenshot-1",
      principle: "perceivable",
      guideline: "1.1.1 Non-text Content",
      wcag_criterion: "1.1.1",
      wcagLevel: "A",
      severity: "minor",
      title: "Screenshot Verification Issue",
      description: "This issue contains a base64 screenshot to verify the new schema support.",
      element: "<div>Sample</div>",
      selector: "div",
      impact: "Testing only",
      remediation: "None",
      helpUrl: "https://example.com",
      occurrences: 1,
      screenshot_data: {
        data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        mime_type: "image/png",
        width: 1,
        height: 1,
        description: "Red Pixel Verification Image"
      }
    }
  ]
};

test.describe('Screenshot Schema Support', () => {
    
    test('renders screenshot_data from audit results', async ({ page }) => {
        // Enable console logging for debugging
        page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
        page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));
        
        // Log all network requests
        page.on('request', request => console.log('>>', request.method(), request.url()));

        await page.goto('/');

        // Mock Supabase Audits Query - Use very permissive regex
        await page.route('**/*audits*', async route => {
            console.log('MOCK: Intercepted audits request:', route.request().url());

            
            // Check if it's a "single" request (header or query param?)
            // Supabase single() typically sends Accept: application/vnd.pgrst.object+json
            // But returning a simple object JSON works for fetch usually.
            
            await route.fulfill({ 
                status: 200,
                contentType: 'application/json',
                json: { 
                    id: 'mock-audit-123',
                    status: 'completed',
                    input_type: 'snippet',
                    input_value: '<div>Test</div>',
                    created_at: new Date().toISOString(),
                    total_issues: 1,
                    critical_issues: 0,
                    serious_issues: 0,
                    moderate_issues: 0,
                    minor_issues: 1,
                    user_id: 'test-user', // Match the E2E user
                    agent_trace: {}
                } 
            });
        });
        
        // Mock Supabase Issues Query
        await page.route('**/*issues*', async route => {
             console.log('MOCK: Intercepted issues request:', route.request().url());
             await route.fulfill({
                 status: 200,
                 contentType: 'application/json',
                 json: [{
                     id: "issue-screenshot-1",
                     audit_id: "mock-audit-123", // Link correctly
                     wcag_principle: "perceivable",
                     wcag_criterion: "1.1.1",
                     wcag_level: "A",
                     severity: "minor",
                     title: "Screenshot Verification Issue",
                     description: "This issue contains a base64 screenshot.",
                     element_html: "<div>Sample</div>",
                     element_selector: "div",
                     user_impact: "Testing only",
                     how_to_fix: "None",
                     wcag_url: "https://example.com",
                     // THE KEY PART:
                     screenshot_data: mockResultWithScreenshot.issues[0].screenshot_data
                 }]
             });
        });


        // Mock the Backend function call
        await page.route('**/.netlify/functions/ai-agent-audit', async route => {
             console.log('MOCK: Intercepted AI agent call');
             await route.fulfill({ json: { auditId: 'mock-audit-123', status: 'completed' } });
        });
        
        // Mock polling API for progress
        // audit-service "runAudit" logic:
        // 1. POST ai-agent-audit -> returns { auditId }
        // 2. Subscribes to Supabase 'audits' channel for updates.
        // 3. Or if channel fails, it might poll?
        // Wait, "runAudit" uses `supabase.channel` for real-time updates.
        // Playwright routing does NOT verify WebSocket connections easily.
        
        // However, "runAudit" ALSO does:
        // if ('auditId' in data && data.auditId) { ... subscription ... }
        // The subscription waits for status='completed'.
        
        // If we cannot mock WebSocket in Playwright easily, we are stuck in "waiting for results".
        
        // Workaround: We force the "quick mode" fallback or exploit an error path 
        // OR we just use the "snippet" model which calls `runAxeAnalysisOnSnippet` IF NOT using AI.
        // But we want to test AI result structure (screenshot_data).
        
        // Let's modify the `runAudit` mock to return the result directly via the "AUDIT_NOT_SAVED" trick.
        // That is robust because it's pure HTTP.
        
        await page.route('**/.netlify/functions/ai-agent-audit', async route => {
             console.log('MOCK: Intercepted AI agent call - returning result with null ID');
             await route.fulfill({
                 status: 200,
                 contentType: 'application/json',
                 body: JSON.stringify({
                    auditId: null, // This triggers AUDIT_NOT_SAVED in service layer
                    summary: {
                             totalIssues: 1,
                             criticalCount: 0,
                             seriousCount: 0,
                             moderateCount: 0,
                             minorCount: 1,
                             passCount: 5,
                             timestamp: new Date().toISOString()
                        },
                        issues: [{
                             wcag_principle: "perceivable",
                             wcag_criterion: "1.1.1",
                             wcag_level: "A",
                             severity: "minor",
                             title: "Screenshot Verification Issue",
                             description: "This issue contains a base64 screenshot.",
                             element_html: "<div>Sample</div>",
                             element_selector: "div",
                             user_impact: "Testing only",
                             how_to_fix: "None",
                             wcag_url: "https://example.com",
                             screenshot_data: mockResultWithScreenshot.issues[0].screenshot_data
                        }]
                 })
             });
        });


        // ACTION:
        await page.evaluate(() => {
          localStorage.setItem('E2E_TEST_USER', 'true');
          window.location.reload();
        });
        
        // Go to Snippet tab
        await page.getByRole('tab', { name: 'Snippet' }).click();
        
        // Fill and Submit
        const textarea = page.getByLabel(/HTML Code Snippet/i);
        await expect(textarea).toBeVisible({ timeout: 10000 });
        await textarea.fill('<div>Test</div>');
        await page.getByRole('button', { name: /Analyze/i }).click();

        // VALIDATION:
        // Find the accordion trigger button for the issue
        const accordionTrigger = page.getByRole('button', { name: /Screenshot Verification Issue/ });
        await expect(accordionTrigger).toBeVisible({ timeout: 15000 });
        
        // Click to expand accordion
        await accordionTrigger.click();
        
        // Look for the "Capture Evidence" section name (as rendered in AuditResults.tsx)
        await expect(page.getByText('Capture Evidence')).toBeVisible();

        // Verify the image thumbnail is rendered
        const thumbnail = page.locator('img[alt="Issue screenshot thumbnail"]');
        await expect(thumbnail).toBeVisible();
        
        // Verify src starts with data:image/png;base64
        const src = await thumbnail.getAttribute('src');
        expect(src).toContain('data:image/png;base64,iVBORw0KGgoAAA');

        // Verify Lightbox functionality
        // Target the wrapper div which acts as the DialogTrigger
        const thumbnailWrapper = page.locator('div.group.relative.cursor-pointer').first();
        await expect(thumbnailWrapper).toBeVisible();

        // Scroll into view comfortably to avoid sticky header
        await thumbnailWrapper.scrollIntoViewIfNeeded();
        
        // Click the wrapper (force used if overlay is still considered 'intercepting')
        await thumbnailWrapper.click({ force: true });

        // Wait for the dialog to appear
        // The mock data has a specific description: "Red Pixel Verification Image"
        const dialogTitle = page.locator('[role="dialog"]').getByText(/Red Pixel Verification Image/i);
        await expect(dialogTitle).toBeVisible();

        // Verify dialog contains full size image
        const dialogImage = page.locator('[role="dialog"] img[alt="Issue screenshot full size"]');
        await expect(dialogImage).toBeVisible();

        // Capture a screenshot of the rendered evidence (with lightbox open) for user verification
        await page.screenshot({ path: 'verification-evidence-lightbox.png', fullPage: true });

        // Close lightbox by clicking outside or pressing Escape
        await page.keyboard.press('Escape');
    });
});
