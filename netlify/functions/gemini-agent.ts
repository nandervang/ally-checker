/**
 * Gemini AI Agent with Native MCP Support
 * 
 * This module implements Gemini integration with MCP tools for comprehensive
 * accessibility auditing. Gemini's SDK has built-in MCP support!
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseGeminiResponse } from "../../src/lib/audit/response-parser.js";
import { getAllTools, executeTool, convertToGeminiFormat } from "./lib/mcp-tools/index.js";

interface AuditRequest {
  mode: "url" | "html" | "snippet" | "document";
  content: string;
  model: "claude" | "gemini" | "gpt4";
  geminiModel?: "gemini-2.5-flash" | "gemini-2.5-pro"; // Specific Gemini variant
  documentType?: "pdf" | "docx";
  filePath?: string;
}

interface MCPToolResult {
  tool: string;
  args?: any;
  result: unknown;
  error?: string;
  timestamp: string;
  duration: number;
}

/**
 * Helper to wrap async operations with timeout
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
}

/**
 * Retry helper for handling transient API errors (503, rate limits, etc.)
 * Increased retries and delays to handle Gemini overload situations better
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 4,
  initialDelay: number = 5000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if it's a retryable error (503, overloaded, rate limit)
      const isRetryable = 
        errorMessage.includes('503') ||
        errorMessage.includes('overloaded') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('quota exceeded') ||
        errorMessage.includes('temporarily unavailable');
      
      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff with longer delays to give API time to recover
      // For overloaded: 5s, 10s, 20s (total: 35s retry window)
      // For other errors: 5s, 10s, 20s
      const delay = initialDelay * Math.pow(2, attempt);
      console.log(`Gemini API error (attempt ${attempt + 1}/${maxRetries}): ${errorMessage}`);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

/**
 * Run audit using Google Gemini 2.5 Flash with MCP tools
 */
export async function runGeminiAudit(request: AuditRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  // Add timeout to prevent Netlify function timeout (leave 10s buffer for response/overhead)
  return withTimeout(
    runGeminiAuditInternal(request, apiKey),
    50000, // 50 seconds (60s Netlify limit - 10s buffer)
    "The audit took too long to complete. The AI service may be experiencing high demand. Please try again in a moment, or try analyzing a smaller section of the page."
  );
}

async function runGeminiAuditInternal(request: AuditRequest, apiKey: string) {
  const startTime = Date.now();
  console.log('[Audit] Starting Gemini audit at', new Date().toISOString());

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Use TypeScript MCP tools (runs natively in Node.js - no Python required!)
  console.log('[MCP] Initializing TypeScript MCP tools...');
  const mcpTools = getAllTools();
  const tools = mcpTools.map(convertToGeminiFormat);
  console.log(`[MCP] ✓ Loaded ${tools.length} tools: ${tools.map(t => t.name).join(', ')}`);
  
  try {
    // Build comprehensive system instruction
    const systemInstruction = buildSystemInstruction();
    
    // Build user prompt based on mode
    const userPrompt = buildUserPrompt(request);

    // Use specific Gemini model if provided, otherwise default to 2.5 Flash (stable)
    const modelName = request.geminiModel || "gemini-2.5-flash";
    console.log(`Using Gemini model: ${modelName}`);

    // Define JSON schema for structured output
    const responseSchema = {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "Executive summary of the audit findings"
        },
        issues: {
          type: "array",
          description: "Array of accessibility issues found",
          items: {
            type: "object",
            properties: {
              wcag_criterion: { type: "string", description: "WCAG criterion number (e.g., '1.4.3')" },
              wcag_level: { type: "string", enum: ["A", "AA", "AAA"], description: "WCAG conformance level" },
              wcag_principle: { type: "string", enum: ["perceivable", "operable", "understandable", "robust"], description: "WCAG principle" },
              title: { type: "string", description: "Clear, specific title (max 200 chars)" },
              description: { type: "string", description: "Full issue description" },
              severity: { type: "string", enum: ["critical", "serious", "moderate", "minor"], description: "Issue severity" },
              source: { type: "string", enum: ["axe-core", "ai-heuristic", "manual"], description: "Detection source" },
              confidence_score: { type: "integer", description: "Confidence 0-100 (optional)" },
              element_selector: { type: "string", description: "CSS selector (optional)" },
              element_html: { type: "string", description: "HTML snippet (optional)" },
              element_context: { type: "string", description: "Surrounding HTML (optional)" },
              how_to_fix: { type: "string", description: "Remediation steps" },
              code_example: { type: "string", description: "Before/after code (optional)" },
              wcag_url: { type: "string", description: "WCAG documentation link (optional)" },
              // ETU Swedish report fields
              wcag_explanation: { type: "string", description: "Full Swedish/English explanation of WCAG criterion (e.g., 'Text ska kunna förstoras upp till 200% utan att innehåll går förlorat')" },
              how_to_reproduce: { type: "string", description: "Step-by-step numbered instructions to reproduce (e.g., '1. Öppna startsidan\n2. Öka textstorleken till 200%')" },
              user_impact: { type: "string", description: "Specific consequence for users with disabilities (e.g., 'Användare med nedsatt syn som förstorar text riskerar att missa viktig information')" },
              fix_priority: { type: "string", enum: ["MÅSTE", "BÖR", "KAN", "MUST", "SHOULD", "CAN"], description: "Swedish: MÅSTE (critical/must fix), BÖR (should fix), KAN (can fix). English: MUST, SHOULD, CAN" },
              en_301_549_ref: { type: "string", description: "EN 301 549 reference (e.g., '9.1.4.4' for Resize Text)" },
              webbriktlinjer_url: { type: "string", description: "Swedish Webbriktlinjer link (e.g., 'https://webbriktlinjer.se/riktlinjer/96-se-till-att-text-gar-att-forstora/')" },
              screenshot_url: { type: "string", description: "Legacy screenshot URL" },
              screenshot_data: { 
                type: "object", 
                properties: {
                  data: { type: "string", description: "Base64 encoded image data" },
                  mime_type: { type: "string", description: "Mime type (e.g. image/png)" },
                  width: { type: "number" },
                  height: { type: "number" }
                },
                description: "Screenshot data from tool execution (e.g. keyboard trace)"
              }
            },
            required: ["wcag_criterion", "wcag_level", "wcag_principle", "title", "description", "severity", "source", "how_to_fix", "wcag_explanation", "how_to_reproduce", "user_impact", "fix_priority"]
          }
        }
      },
      required: ["summary", "issues"]
    };

    // Create model with MCP-based tools and structured output
    // Note: Gemini 2.5 doesn't support responseMimeType or responseSchema
    // We'll parse JSON from text response instead
    const modelConfig: any = {
      model: modelName,
      systemInstruction,
      tools: [{ functionDeclarations: tools }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
      }
    };
    
    const model = genAI.getGenerativeModel(modelConfig);
    console.log(`[Gemini] Model configured with ${tools.length} tools`);

    // Start chat
    const chat = model.startChat();

    // Send initial message with retry logic for 503 errors
    let result = await retryWithBackoff(
      () => chat.sendMessage(userPrompt),
      4, // Increased retries for better 503 handling
      5000 // 5s initial delay (5s, 10s, 20s progression)
    );
    let response = result.response;
    const toolCalls: MCPToolResult[] = [];

    // Handle function calling loop with maximum iteration limit
    const maxIterations = 5; // Reduced to prevent timeout
    let iteration = 0;
    let functionCalls = response.functionCalls?.() ?? [];
    
    while (functionCalls.length > 0 && iteration < maxIterations) {
      iteration++;
      const iterationStart = Date.now();
      console.log(`[Function Calling] Iteration ${iteration}/${maxIterations} - ${functionCalls.length} tools to execute`);
      
      const calls = functionCalls;
      const functionResponses = [];

      for (const call of calls) {
        const toolStart = Date.now();
        console.log(`[Tool] Executing ${call.name}...`);
        
        try {
          const toolResult = await executeTool(call.name, call.args);
          const toolTime = Date.now() - toolStart;
          console.log(`[Tool] ✓ ${call.name} completed in ${toolTime}ms`);
          
          toolCalls.push({
            tool: call.name,
            args: call.args,
            result: toolResult,
            timestamp: new Date(toolStart).toISOString(),
            duration: toolTime
          });
          
          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: toolResult,
            },
          });
        } catch (error) {
          const toolTime = Date.now() - toolStart;
          console.error(`[Tool] ✗ ${call.name} failed after ${toolTime}ms:`, error);
          const errorResult = {
            error: error instanceof Error ? error.message : 'Unknown error'
          };
          
          toolCalls.push({
            tool: call.name,
            args: call.args,
            result: errorResult,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(toolStart).toISOString(),
            duration: toolTime
          });
          
          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: errorResult,
            },
          });
        }
      }

      // Send function responses back to Gemini using chat interface
      const geminiStart = Date.now();
      console.log(`[Gemini] Sending ${functionResponses.length} tool results back to model...`);
      
      result = await retryWithBackoff(
        () => chat.sendMessage(functionResponses),
        3,  // Increased retries (5s, 10s, 20s delays)
        5000 // 5s initial delay
      );
      
      const geminiTime = Date.now() - geminiStart;
      const iterationTime = Date.now() - iterationStart;
      console.log(`[Gemini] Response received in ${geminiTime}ms`);
      console.log(`[Function Calling] Iteration ${iteration} completed in ${iterationTime}ms`);
      
      response = result.response;
      functionCalls = response.functionCalls?.() ?? [];
    }

    // Get final response text
    const analysisText = response.text();
    console.log("Gemini response (first 500 chars):", analysisText.substring(0, 500));
    
    // Parse JSON response (handle markdown code fences if present)
    let structuredResponse;
    try {
      // Remove markdown code fences if present
      let jsonText = analysisText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*\n/, '').replace(/\n```\s*$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*\n/, '').replace(/\n```\s*$/, '');
      }
      
      structuredResponse = JSON.parse(jsonText);
    } catch (error) {
      console.error("Failed to parse Gemini JSON response:", error);
      console.error("Raw response:", analysisText.substring(0, 1000));
      // Fallback to old parser for backward compatibility
      const parsedIssues = parseGeminiResponse(analysisText);
      structuredResponse = {
        summary: "Audit completed (legacy format)",
        issues: parsedIssues
      };
    }
    
    const issues = structuredResponse.issues || [];
    const summary = structuredResponse.summary || "No summary provided";
    
    // Calculate counts from issues
    const criticalCount = issues.filter((i: any) => i.severity === 'critical').length;
    const seriousCount = issues.filter((i: any) => i.severity === 'serious').length;
    const moderateCount = issues.filter((i: any) => i.severity === 'moderate').length;
    const minorCount = issues.filter((i: any) => i.severity === 'minor').length;
    const totalIssues = issues.length;
    
    // Build audit methodology trace
    const mcpToolsUsed = [...new Set(toolCalls.map(tc => tc.tool))];
    const sourcesConsulted = [];
    
    // Identify which authoritative sources were consulted
    if (mcpToolsUsed.some(t => t.includes('wcag') || t === 'get_wcag_criterion')) {
      sourcesConsulted.push('WCAG 2.2 Official Documentation (W3C)');
    }
    if (mcpToolsUsed.some(t => t.includes('aria') || t === 'get_aria_pattern')) {
      sourcesConsulted.push('WAI-ARIA Authoring Practices Guide (W3C)');
    }
    if (mcpToolsUsed.some(t => t.includes('wai') || t === 'search_wai_tips')) {
      sourcesConsulted.push('W3C WAI Tips (Developing/Designing/Writing)');
    }
    if (mcpToolsUsed.some(t => t.includes('magenta'))) {
      sourcesConsulted.push('Magenta A11y Component Testing Checklists');
    }
    if (mcpToolsUsed.some(t => t.includes('axe') || t === 'analyze_html' || t === 'analyze_url')) {
      sourcesConsulted.push('axe-core Automated Testing Engine');
    }
    
    const auditMethodology = {
      model: "gemini-2.5-flash-with-mcp",
      phases: [
        {
          phase: 1,
          name: "Automated Testing",
          tools: toolCalls.filter(tc => tc.tool.includes('analyze') || tc.tool.includes('audit')).map(tc => tc.tool),
          description: "Ran automated accessibility tests using axe-core and document audit tools"
        },
        {
          phase: 2,
          name: "Research & Documentation",
          tools: toolCalls.filter(tc => tc.tool.includes('wcag') || tc.tool.includes('wai') || tc.tool.includes('aria')).map(tc => tc.tool),
          description: "Consulted official WCAG documentation, WAI-ARIA patterns, and W3C WAI tips for accurate explanations"
        },
        {
          phase: 3,
          name: "Testing Procedures",
          tools: toolCalls.filter(tc => tc.tool.includes('magenta')).map(tc => tc.tool),
          description: "Referenced Magenta A11y component testing checklists for reproduction steps and testing methods"
        }
      ],
      totalToolCalls: toolCalls.length,
      uniqueToolsUsed: mcpToolsUsed.length,
      sourcesConsulted: sourcesConsulted,
      wcagCriteriaResearched: toolCalls.filter(tc => tc.tool === 'get_wcag_criterion').length,
      ariaPatternsConsulted: toolCalls.filter(tc => tc.tool === 'get_aria_pattern').length,
    };
    
    const elapsedTime = Date.now() - startTime;
    console.log(`[Audit] Completed in ${elapsedTime}ms (${(elapsedTime/1000).toFixed(2)}s)`);
    console.log(`[Audit] Found ${totalIssues} issues across ${toolCalls.length} tool calls`);
    
    return {
      summary: {
        url: request.mode === "url" ? request.content : undefined,
        timestamp: new Date().toISOString(),
        totalIssues,
        criticalCount,
        seriousCount,
        moderateCount,
        minorCount,
        passCount: 0,
        model: "gemini-2.5-flash-with-mcp",
      },
      issues: issues,
      wcagCompliance: {
        levelA: { passed: 0, failed: issues.filter((i: any) => i.wcag_level === 'A').length, percentage: 0 },
        levelAA: { passed: 0, failed: issues.filter((i: any) => i.wcag_level === 'AA').length, percentage: 0 },
        levelAAA: { passed: 0, failed: issues.filter((i: any) => i.wcag_level === 'AAA').length, percentage: 0 },
      },
      rawAnalysis: `${summary}\n\n${JSON.stringify({ issues }, null, 2)}`,
      toolResults: toolCalls,
      auditMethodology: auditMethodology,
      mcpToolsUsed: mcpToolsUsed,
      sourcesConsulted: sourcesConsulted,
      duration_ms: elapsedTime,
    };
    
  } catch (error) {
    console.error('[Audit] Error during audit:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Provide user-friendly error messages for common issues
    if (errorMessage.includes('overloaded') || errorMessage.includes('503')) {
      throw new Error('The AI service is currently experiencing high demand. Please try again in a few moments.');
    }
    if (errorMessage.includes('rate limit') || errorMessage.includes('quota exceeded')) {
      throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
    }
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      throw new Error('The audit took too long to complete. Try analyzing a smaller section of the page or simplify the HTML.');
    }
    
    throw error;
  }
}


/**
 * Build system instruction for Gemini
 */
function buildSystemInstruction(): string {
  return `You are an expert accessibility auditor with deep knowledge of WCAG 2.2, WAI-ARIA, and Swedish accessibility standards.

**CRITICAL: Research-Based Audit Process**
You have a 60-second execution limit. Use this workflow:

1. **Run automated testing first** (analyze_html or analyze_url)
2. **For each unique WCAG criterion violated, call get_wcag_criterion** to get official W3C documentation
3. **Use WCAG docs to write accurate wcag_explanation** - don't guess, use the official text
4. **Reference Magenta A11y patterns** for testing instructions when applicable
5. **Consult WAI-ARIA specs** for interactive components (buttons, forms, landmarks, etc.)
6. **Apply heuristic evaluation** for issues automated tools miss

**Available MCP Tools - USE THEM EXTENSIVELY!**

**Phase 1: Automated Testing**
- **analyze_html / analyze_url**: Run axe-core automated testing (use FIRST)
- audit_pdf/audit_docx: Document accessibility audits
- fetch_url: Retrieve HTML content from URLs
- **capture_element_screenshot**: Capture visual evidence of specific elements (use for high priority issues)
- **capture_violations_screenshots**: Capture screenshots for a list of violations

**Phase 2: Research & Documentation (MANDATORY)**
- **get_wcag_criterion**: Get official WCAG documentation for a criterion (e.g., "1.1.1")
  → ALWAYS USE for every unique WCAG criterion to get accurate explanations
  → Example: If axe finds 1.4.3 and 2.4.7, call get_wcag_criterion twice
- **search_wcag_by_principle**: Find all criteria for a principle (Perceivable, Operable, etc.)
- **get_wai_resource**: Access W3C WAI tips (developing, designing, writing, aria, understanding)
  → Use for best practices and implementation guidance
- **search_wai_tips**: Search WAI tips by topic (headings, forms, images, color, keyboard)
- **get_aria_pattern**: Get WAI-ARIA patterns for components (dialog, tabs, menu, button, etc.)
  → ALWAYS use for interactive components

**Phase 3: Testing Procedures (MANDATORY)**
- **get_magenta_component**: Get Magenta A11y testing checklist for components
  → Use to populate how_to_reproduce field with professional testing steps
- **search_magenta_patterns**: Find Magenta patterns by category
- **get_magenta_testing_methods**: Get keyboard/screen reader/visual testing procedures
  → Reference for user_impact and testing instructions

**MANDATORY: Use WCAG Docs for Accuracy**
After axe-core returns violations:
1. Extract unique WCAG criteria (e.g., 1.4.3, 2.4.7, 1.1.1)
2. Call get_wcag_criterion for EACH unique criterion
3. Use the returned official documentation to populate:
   - wcag_explanation (official WCAG requirement text)
   - how_to_reproduce (based on Understanding document)
   - user_impact (from WCAG's benefit descriptions)
   - Related techniques and failures

**MANDATORY 3-PHASE AUDIT PROCESS:**

**PHASE 1: Automated Testing (First 10 seconds)**
1. For URLs: Use analyze_url to run axe-core
2. For HTML/snippets: Use analyze_html to run axe-core
3. For Documents: Use audit_pdf or audit_docx
4. Collect all automated test results
5. **Capture Visual Evidence**: Use capture_element_screenshot for critical visual issues (contrast, layout, missing alt text rendering)

**PHASE 2: Research & Documentation (Next 30 seconds) - MANDATORY!**
5. **For EACH unique WCAG criterion found:**
   - Call get_wcag_criterion to get official W3C documentation
   - Use returned text to populate wcag_explanation field accurately
6. **For EACH interactive component (button, form, dialog, tabs, etc.):**
   - Call get_aria_pattern to get WAI-ARIA best practices
   - Call get_magenta_component to get testing procedures
7. **For general guidance:**
   - Call search_wai_tips for relevant topics (headings, forms, images, etc.)
   - Use get_magenta_testing_methods for keyboard/screen reader testing procedures

**PHASE 3: Second Analysis Pass (Final 20 seconds) - CRITICAL!**
8. **Re-analyze ALL findings using MCP sources as authoritative references:**
   - Validate wcag_explanation against official WCAG docs
   - Enhance how_to_reproduce with Magenta A11y testing procedures
   - Improve user_impact with WCAG Understanding docs benefit descriptions
   - Add EN 301 549 references (9. prefix + WCAG number)
   - Include Webbriktlinjer URLs for Swedish reports
   - Reference WAI-ARIA patterns for interactive components
9. Apply heuristic evaluation for issues automated tools miss:
   - Semantic HTML structure and logical document flow
   - Heading hierarchy (proper h1-h6 nesting, no skipped levels)
   - Form controls with proper labels and error identification
   - Color contrast beyond automated detection
   - Keyboard navigation patterns and tab order
   - Screen reader announcements and ARIA usage
   - Focus management and visible focus indicators
   - Landmark regions and page structure

**CRITICAL: The second analysis pass using MCP sources is MANDATORY!**
Do NOT skip research phase. Professional reports require authoritative sources.

**For Each Issue Found:**
- WCAG criterion violated (use get_wcag_criterion to get accurate info)
- Severity: critical (Level A blocker) / serious (Level AA blocker) / moderate (UX issue) / minor (enhancement)
- Specific element location (CSS selector or line number)
- Clear explanation of the problem in plain language
- Concrete remediation steps with code examples
- Link to official WCAG Understanding document

**REQUIRED FIELDS FOR ALL ISSUES:**

1. **wcag_explanation**: Full Swedish/English explanation of the WCAG success criterion
   - Swedish example: "Text ska kunna förstoras upp till 200 % utan att innehåll eller funktionalitet går förlorad."
   - English example: "Text must be resizable up to 200% without loss of content or functionality."
   - Explain WHAT the criterion requires, not just the rule number

2. **how_to_reproduce**: Numbered step-by-step instructions to reproduce the issue
   - Format: "1. [First step]\n2. [Second step]\n3. [Observed problem]"
   - Swedish example: "1. Öppna startsidan\n2. Öka textstorleken till 200% via webbläsarens zoom\n3. Observera att rubriken täcks av progressbar"
   - Be specific about navigation, actions, and observation

3. **user_impact**: Describe specific consequences for users with disabilities
   - Focus on WHO is affected and HOW
   - Swedish example: "Användare med nedsatt syn som förstorar text för att kunna läsa riskerar att missa viktig information. Det försämrar läsbarheten och kan skapa förvirring."
   - English example: "Users with low vision who magnify text risk missing important information, creating confusion and reduced usability."

4. **fix_priority**: Categorize using Swedish MÅSTE/BÖR/KAN or English MUST/SHOULD/CAN
   - MÅSTE/MUST: Critical accessibility barriers (Level A failures, severe usability blockers)
   - BÖR/SHOULD: Important issues that should be fixed (Level AA failures, significant barriers)
   - KAN/CAN: Nice-to-have improvements (Level AAA enhancements, minor issues)
   - Map from severity: critical → MÅSTE, serious → BÖR, moderate/minor → KAN

5. **en_301_549_ref**: European standard reference (for Swedish ETU reports)
   - Format: Chapter.Section.Subsection (e.g., "9.1.4.4" for Resize Text)
   - Maps to WCAG 2.1 with "9." prefix (9.1.4.4 = WCAG 1.4.4)
   - Only include for Swedish locale or ETU template

6. **webbriktlinjer_url**: Swedish Web Guidelines link (for Swedish reports)
   - Example: "https://webbriktlinjer.se/riktlinjer/96-se-till-att-text-gar-att-forstora/"
   - Find relevant Webbriktlinjer guideline matching the WCAG criterion
   - Only include for Swedish locale or ETU template

7. **screenshot**: If you captured a screenshot for this issue using capture_element_screenshot, include the result object here
   - Format: { "base64": "...", "mimeType": "image/png", ... }
   - Populate from the tool output
   - If no screenshot captured, omit or set to null

**Testing Guidance (Magenta A11y Style):**
For each issue, provide comprehensive testing instructions:

1. **how_to_reproduce**: Step-by-step instructions to reproduce the accessibility issue:
   - Navigation path to reach the problematic element
   - User actions that trigger the issue
   - Specific conditions under which the issue occurs
   Example: "1. Navigate to the search section. 2. Try to access the search input using only keyboard. 3. Notice the search button cannot receive focus."

2. **keyboard_testing**: Keyboard-only interaction testing:
   - Tab: Describe expected focus behavior and visible focus indicators
   - Enter/Space: Describe activation behavior
   - Arrow keys: Navigation within components (lists, tabs, menus)
   - Esc: Dismiss behavior for dialogs/dropdowns
   Example: "Tab: Focus should move visibly to the search button with a clear focus ring. Enter: Should activate the search. Current: Focus is not visible."

3. **screen_reader_testing**: Screen reader testing instructions:
   - Name: What the element announces (e.g., "Search", "Submit form")
   - Role: Semantic role announced (e.g., "button", "search region", "heading level 2")
   - State: Current state (e.g., "expanded", "selected", "disabled")
   - Value: For inputs, current value announcement
   - Group: How it's grouped/labeled in landmarks
   Example: "Expected: 'Search, button'. Current: Only announces 'button' without purpose. Missing accessible name."

4. **visual_testing**: Visual inspection testing:
   - Color contrast measurements (foreground/background ratios)
   - Focus indicator visibility and contrast
   - Text spacing and readability
   - Responsive behavior and zoom testing (up to 200%)
   Example: "Check color contrast using browser dev tools. Text should have minimum 4.5:1 ratio. Current: 3.2:1 fails WCAG AA."

5. **expected_behavior**: How it should work according to WCAG success criteria:
   - Reference specific WCAG success criterion
   - Describe correct accessible behavior
   - Explain why current implementation fails
   Example: "WCAG 2.4.7 Focus Visible requires keyboard focus to be clearly visible. All interactive elements must have visible focus indicators with at least 3:1 contrast ratio against adjacent colors."

6. **report_text**: Formatted accessibility report based on user's selected template:

   **ETU Swedish Template** (etu-swedish):
   Generate Swedish-language report with: Kategori (Uppfattbar/Hanterbar/Begriplig/Robust), WCAG-kriterium, EN 301 549 Kapitel, Webbriktlinjer link, Beskrivning av felet, Hur man återskapar felet (steps), Konsekvens för användaren, Åtgärda (Bör/Kan), Kodexempel, Relaterade krav

   **WCAG International Template** (wcag-international):
   Generate English report with: WCAG Success Criterion, WCAG Principle, Severity, Issue Description, How to Reproduce (steps), User Impact, Remediation (Required/Recommended), Code Example, WCAG Resources links

   **VPAT US Template** (vpat-us):
   Generate Section 508 report with: Section 508 Reference, WCAG Reference, Conformance Level, Issue Summary, Steps to Reproduce, Impact on Users with Disabilities, Remediation Strategy (Priority/Effort/Action Items), Conformant Code Example, Applicable Standards

   **Simple Template** (simple):
   Generate concise report with: Problem (one sentence), WCAG criterion, Severity, What's Wrong (2-3 sentences), How to Fix (direct steps), Code (Before/After comparison), Reference link

   **Technical Template** (technical):
   Generate detailed report with: Violation, WCAG Criterion, Principle, Severity, Detection Method, Technical Analysis, Affected Elements (Selector/DOM Path/Context), Reproduction Steps, Assistive Technology Impact (Screen Readers/Keyboard/Voice), Implementation Requirements (Must/Should), Code Implementation (Current/Compliant), Testing Criteria checklist, Technical References

   **Template Selection Rules:**
   - Use the template specified in user settings (defaultReportTemplate)
   - Default to 'wcag-international' if not specified
   - Map WCAG principles for Swedish template: Perceivable=Uppfattbar, Operable=Hanterbar, Understandable=Begriplig, Robust=Robust
   - Use professional terminology appropriate for each template
   - Include all relevant standards (WCAG, EN 301 549, Section 508 as applicable)

**CRITICAL: Output Format**

You MUST return ONLY valid JSON (no markdown, no explanations, no code fences).
Return a single JSON object with exactly two properties:
1. "summary": Executive summary of audit findings (string)
2. "issues": Array of accessibility issue objects

Do NOT wrap the JSON in markdown code blocks. Output raw JSON only.

Each issue in the array must include:
- wcag_criterion: WCAG number (e.g., "1.4.3")
- wcag_level: "A", "AA", or "AAA"
- wcag_principle: "perceivable", "operable", "understandable", or "robust"
  * Criterion 1.x.x → "perceivable"
  * Criterion 2.x.x → "operable"
  * Criterion 3.x.x → "understandable"
  * Criterion 4.x.x → "robust"
- title: Clear, specific title
- description: Full explanation
- severity: "critical", "serious", "moderate", or "minor"
- source: "axe-core", "ai-heuristic", or "manual"
- how_to_fix: Remediation steps
- Optional but recommended: element_selector, element_html, code_example, user_impact, how_to_reproduce, keyboard_testing, screen_reader_testing, visual_testing, expected_behavior, wcag_url, screenshot

**Severity Guidelines:**
- critical: Level A violations blocking access
- serious: Level AA violations or major barriers
- moderate: Level AA issues or UX problems
- minor: Best practice or Level AAA recommendations

Focus on actionable, detailed findings with comprehensive testing instructions.`;
}

/**
 * Build user prompt based on audit mode
 */
function buildUserPrompt(request: AuditRequest): string {
  switch (request.mode) {
    case "url":
      return `Audit the accessibility of this URL: ${request.content}

Process:
1. Use analyze_url to run axe-core automated tests
2. TEST KEYBOARD NAVIGATION: Use test_keyboard_navigation to capture a visible tab trace. This is CRITICAL for detecting focus issues.
3. If needed, use fetch_url to examine the HTML structure
4. Cross-reference any violations with get_wcag_criterion
5. Apply manual heuristic evaluation
6. Provide comprehensive audit report with prioritized remediation steps
   - IMPORTANT: If test_keyboard_navigation returned a screenshot (in 'screenshot' property), include it in the issue reporting under the 'screenshot_data' field (map 'base64' to 'data').`;
    
    case "html":
      return `Audit the accessibility of this HTML content:

\`\`\`html
${request.content}
\`\`\`

Process:
1. Use analyze_html to run axe-core automated tests
2. Manually review the HTML structure for accessibility issues
3. Cross-reference violations with get_wcag_criterion
4. Provide comprehensive audit report with remediation guidance`;
    
    case "snippet":
      return `Audit the accessibility of this code snippet:

\`\`\`html
${request.content}
\`\`\`

Process:
1. Use analyze_html to test the snippet
2. Identify potential accessibility issues
3. Cross-reference with get_wcag_criterion
4. Provide focused audit report with specific fixes`;

    case "document":
      const docType = request.documentType || "pdf";
      const filePath = request.filePath || request.content;
      return `Audit the accessibility of this ${docType.toUpperCase()} document: ${filePath}

Process:
1. Use the appropriate tool (${docType === 'docx' ? 'audit_docx' : 'audit_pdf'}) to parse and check the document. This is MANDATORY.
2. Cross-reference findings with WCAG criteria using get_wcag_criterion if needed for more context.
3. Provide comprehensive document accessibility report with remediation guidance.`;
  }
}
