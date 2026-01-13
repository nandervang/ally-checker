/**
 * MCP Playwright Screenshots Tool - TypeScript Implementation
 * Captures screenshots of accessibility issues with element highlighting
 * 
 * NOTE: Playwright requires browser binaries which may not be available
 * in all serverless environments. This tool gracefully degrades if unavailable.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

// Lazy load Playwright to avoid top-level await
let playwrightModule: any = null;
let playwrightLoadAttempted = false;

async function loadPlaywright() {
  if (playwrightLoadAttempted) {
    return playwrightModule;
  }
  
  playwrightLoadAttempted = true;
  
  try {
    playwrightModule = await import("playwright");
    console.log("[Playwright] ✓ Loaded successfully");
    return playwrightModule;
  } catch (error) {
    console.warn("[Playwright] Browser binaries not available - screenshot tools disabled");
    console.warn("[Playwright] Error:", error instanceof Error ? error.message : error);
    return null;
  }
}

export const playwrightTools: Tool[] = [
  {
    name: "capture_element_screenshot",
    description:
      "Capture a screenshot of a specific element on a page, highlighting accessibility issues",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL of the page to screenshot",
        },
        selector: {
          type: "string",
          description: "CSS selector of the element to screenshot",
        },
        highlight: {
          type: "boolean",
          description:
            "Whether to highlight the element with a border (default: true)",
        },
        fullPage: {
          type: "boolean",
          description: "Capture full page instead of just element",
        },
      },
      required: ["url", "selector"],
    },
  },
  {
    name: "capture_violations_screenshots",
    description:
      "Capture screenshots for multiple accessibility violations on a page",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL of the page",
        },
        violations: {
          type: "array",
          description: "Array of violations with selectors to screenshot",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Unique ID for the violation",
              },
              selector: {
                type: "string",
                description: "CSS selector for the problematic element",
              },
              description: {
                type: "string",
                description: "Description of the issue",
              },
            },
            required: ["id", "selector"],
          },
        },
        maxScreenshots: {
          type: "number",
          description: "Maximum number of screenshots to capture (default: 5)",
        },
      },
      required: ["url", "violations"],
    },
  },
  {
    name: "test_keyboard_navigation",
    description: "Simulate keyboard TAB navigation to check logical reading order and focus management",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL of the page",
        },
        maxSteps: {
          type: "number",
          description: "Maximum number of TAB presses (default: 20)",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "check_focus_styles",
    description: "Check if the specified element has visible focus indicators",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "The URL of the page" },
        selector: { type: "string", description: "CSS selector of the element to focus" },
      },
      required: ["url", "selector"],
    },
  },
];

interface Screenshot {
  selector: string;
  base64: string;
  mimeType: string;
  width: number;
  height: number;
  timestamp: string;
}

let browser: any = null;

async function getBrowser(): Promise<any> {
  const playwright = await loadPlaywright();
  if (!playwright) {
    throw new Error("Playwright browser not available in this environment");
  }
  
  if (!browser) {
    browser = await playwright.chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    });
  }
  return browser;
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

async function highlightElement(page: any, selector: string): Promise<void> {
  await page.evaluate((sel: string) => {
    const element = document.querySelector(sel);
    if (element && element instanceof HTMLElement) {
      element.style.outline = "3px solid #ff0000";
      element.style.outlineOffset = "2px";
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, selector);
  
  // Wait for scroll to complete
  await page.waitForTimeout(500);
}

async function captureElementScreenshot(
  page: any,
  selector: string,
  highlight: boolean = true,
  fullPage: boolean = false
): Promise<Screenshot> {
  try {
    // Highlight the element if requested
    if (highlight) {
      await highlightElement(page, selector);
    }

    // Capture screenshot
    const element = await page.$(selector);
    if (!element && !fullPage) {
      throw new Error(`Element not found: ${selector}`);
    }

    const screenshotBuffer = fullPage
      ? await page.screenshot({ fullPage: true, type: "png" })
      : element
        ? await element.screenshot({ type: "png" })
        : await page.screenshot({ type: "png" });

    const base64 = screenshotBuffer.toString("base64");

    // Get dimensions
    const dimensions = element
      ? await element.boundingBox()
      : { width: 1280, height: 720 };

    return {
      selector,
      base64,
      mimeType: "image/png",
      width: Math.round(dimensions?.width || 1280),
      height: Math.round(dimensions?.height || 720),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(
      `Screenshot capture failed for ${selector}: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function handlePlaywrightTool(
  name: string,
  args: Record<string, any>
): Promise<any> {
  // Check if Playwright is available
  const playwright = await loadPlaywright();
  if (!playwright) {
    return {
      success: false,
      error: "Playwright not available - browser binaries not installed in this environment",
      note: "Screenshot tools require Playwright browser binaries which are not available in standard Netlify Functions. Consider using playwright-aws-lambda or a different deployment environment.",
    };
  }

  if (name === "capture_element_screenshot") {
    const {
      url,
      selector,
      highlight = true,
      fullPage = false,
    } = args;

    const browserInstance = await getBrowser();
    const page = await browserInstance.newPage();

    try {
      console.log(
        `[Playwright] Navigating to ${url} to screenshot ${selector}`
      );
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

      const screenshot = await captureElementScreenshot(
        page,
        selector,
        highlight,
        fullPage
      );

      return {
        success: true,
        screenshot,
        url,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Screenshot capture failed",
        url,
        selector,
      };
    } finally {
      await page.close();
    }
  }

  if (name === "capture_violations_screenshots") {
    const { url, violations, maxScreenshots = 5 } = args;

    const browserInstance = await getBrowser();
    const page = await browserInstance.newPage();

    try {
      console.log(
        `[Playwright] Navigating to ${url} to capture ${violations.length} violations`
      );
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

      const screenshots: Array<{
        violationId: string;
        description?: string;
        screenshot: Screenshot;
      }> = [];

      // Capture screenshots for violations (up to maxScreenshots)
      const violationsToCapture = violations.slice(0, maxScreenshots);

      for (const violation of violationsToCapture) {
        try {
          console.log(
            `[Playwright] Capturing screenshot for violation ${violation.id}: ${violation.selector}`
          );

          const screenshot = await captureElementScreenshot(
            page,
            violation.selector,
            true,
            false
          );

          screenshots.push({
            violationId: violation.id,
            description: violation.description,
            screenshot,
          });
        } catch (error) {
          console.error(
            `[Playwright] Failed to capture ${violation.id}:`,
            error
          );
          // Continue with other screenshots
        }
      }

      return {
        success: true,
        url,
        totalViolations: violations.length,
        capturedScreenshots: screenshots.length,
        screenshots,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Violations screenshot capture failed",
        url,
      };
    } finally {
      await page.close();
    }
  }

  if (name === "test_keyboard_navigation") {
    const { url, maxSteps = 20 } = args;
    const browserInstance = await getBrowser();
    const page = await browserInstance.newPage();
    
    try {
      console.log(`[Playwright] Testing keyboard navigation on ${url}`);
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      
      const trace: any[] = [];
      
      // Initial focus check
      const initialFocus = await page.evaluate(() => {
        const active = document.activeElement;
        return {
          tagName: active?.tagName.toLowerCase(),
          id: active?.id,
          className: active?.className,
          text: active?.textContent?.substring(0, 50).trim() || '',
          role: active?.getAttribute('role')
        };
      });
      trace.push({ step: 0, key: 'INITIAL', focus: initialFocus });

      for (let i = 1; i <= maxSteps; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100); // Wait for focus transition
        
        const focusInfo = await page.evaluate(() => {
          const active = document.activeElement;
          const rect = active?.getBoundingClientRect();
          return {
            tagName: active?.tagName.toLowerCase(),
            id: active?.id,
            className: active?.className,
            text: active?.textContent?.substring(0, 50).trim() || '',
            role: active?.getAttribute('role'),
            // Check specific focus styles
            outline: window.getComputedStyle(active as Element).outline,
            boxShadow: window.getComputedStyle(active as Element).boxShadow,
            border: window.getComputedStyle(active as Element).border,
            // Coordinates for visualization
            rect: rect ? { 
                x: rect.left + window.scrollX, 
                y: rect.top + window.scrollY, 
                width: rect.width, 
                height: rect.height 
            } : null
          };
        });
        
        trace.push({ step: i, key: 'Tab', focus: focusInfo });
        
        // Stop if we looped back to body or start
        if (trace.length > 2 && JSON.stringify(focusInfo) === JSON.stringify(trace[1].focus)) {
           trace.push({ note: "Focus loop detected" });
           break;
        }
      }

      // Generate visualization overlay
      await page.evaluate((traceData: any[]) => {
          const container = document.createElement('div');
          container.style.position = 'absolute';
          container.style.top = '0';
          container.style.left = '0';
          container.style.width = '100%';
          container.style.height = '100%';
          container.style.pointerEvents = 'none';
          container.style.zIndex = '2147483647'; // Max z-index
          document.body.appendChild(container);

          traceData.forEach((item, index) => {
              if (!item.focus?.rect) return;
              const { x, y, width, height } = item.focus.rect;
              
              // Draw box
              const box = document.createElement('div');
              box.style.position = 'absolute';
              box.style.left = `${x}px`;
              box.style.top = `${y}px`;
              box.style.width = `${width}px`;
              box.style.height = `${height}px`;
              box.style.border = '2px solid #2563eb'; // Blue
              box.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
              box.style.borderRadius = '4px';
              container.appendChild(box);

              // Draw badge
              const badge = document.createElement('div');
              badge.textContent = `${index}`;
              badge.style.position = 'absolute';
              badge.style.left = `${x - 10}px`;
              badge.style.top = `${y - 10}px`;
              badge.style.backgroundColor = '#2563eb';
              badge.style.color = 'white';
              badge.style.borderRadius = '50%';
              badge.style.width = '20px';
              badge.style.height = '20px';
              badge.style.display = 'flex';
              badge.style.alignItems = 'center';
              badge.style.justifyContent = 'center';
              badge.style.fontSize = '12px';
              badge.style.fontWeight = 'bold';
              badge.style.zIndex = '10';
              container.appendChild(badge);
              
              // Draw connector line to next point
              if (index < traceData.length - 1) {
                  const nextRect = traceData[index + 1].focus?.rect;
                  if (nextRect) {
                      // Simple SVG for line
                      // Note: For simplicity in this injected script, creating a large SVG for all lines might be heavy
                      // skipping lines for now to keep it lightweight, boxes+numbers are good enough
                  }
              }
          });
      }, trace);

      // Capture screenshot of the visualization
      const screenshotBuffer = await page.screenshot({ fullPage: true, type: 'png' });
      const base64Screenshot = screenshotBuffer.toString('base64');

      return {
        success: true,
        stepsTaken: trace.length,
        trace,
        analysis: "Review the trace to ensure logical order. Check if 'outline' or 'boxShadow' styles indicate visible focus.",
        screenshot: {
            base64: base64Screenshot,
            mimeType: "image/png"
        }
      };
    } catch (error) {
       return { success: false, error: error instanceof Error ? error.message : "Keyboard navigation failed" };
    } finally {
      await page.close();
    }
  }

  if (name === "check_focus_styles") {
      const { url, selector } = args;
      const browserInstance = await getBrowser();
      const page = await browserInstance.newPage();

      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
        
        const result = await page.evaluate(async (sel: string) => {
            const el = document.querySelector(sel);
            if (!el) return { found: false };
            
            if (el instanceof HTMLElement) {
                el.focus();
            } else {
                return { found: true, focusable: false, error: "Not an HTMLElement" };
            }

            // Wait a tick
            await new Promise(r => setTimeout(r, 100));

            const style = window.getComputedStyle(el);
            const activeEl = document.activeElement;
            const isFocused = activeEl === el;

            return {
                found: true,
                focusable: isFocused,
                tagName: el.tagName,
                styles: {
                    outline: style.outline,
                    outlineColor: style.outlineColor,
                    outlineStyle: style.outlineStyle,
                    outlineWidth: style.outlineWidth,
                    boxShadow: style.boxShadow,
                    border: style.border
                },
                computedOutlineWidth: parseInt(style.outlineWidth) || 0,
                hasVisibleFocus: style.outlineStyle !== 'none' || style.boxShadow !== 'none'
            };
        }, selector);

        return {
            success: true,
            selector,
            ...result,
            analysis: result.hasVisibleFocus 
                ? "Element appears to have visible focus indicators." 
                : "WARNING: Element may be missing visible focus indicators. Check 'styles' property."
        };

      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Focus check failed" };
      } finally {
        await page.close();
      }
  }

  return { error: `Unknown Playwright tool: ${name}` };
}
