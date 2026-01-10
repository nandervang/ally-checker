/**
 * Gemini AI Agent with Native MCP Support
 * 
 * This module implements Gemini integration with MCP tools for comprehensive
 * accessibility auditing. Gemini's SDK has built-in MCP support!
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";
import path from "path";
import { parseGeminiResponse } from "../../src/lib/audit/response-parser.js";

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
  result: unknown;
  error?: string;
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
 * Run audit using Google Gemini 2.5 Flash with MCP tools
 */
export async function runGeminiAudit(request: AuditRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  // Add timeout to prevent Netlify function timeout (leave 2s buffer)
  return withTimeout(
    runGeminiAuditInternal(request, apiKey),
    28000, // 28 seconds (30s Netlify limit - 2s buffer)
    "Audit timed out - processing took too long. Try with a smaller HTML sample."
  );
}

async function runGeminiAuditInternal(request: AuditRequest, apiKey: string) {

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Initialize MCP clients for all three servers
  const { clients, tools } = await initializeMCPTools();
  
  try {
    // Build comprehensive system instruction
    const systemInstruction = buildSystemInstruction();
    
    // Build user prompt based on mode
    const userPrompt = buildUserPrompt(request);

    // Use specific Gemini model if provided, otherwise default to 2.5 Flash
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
              wcag_url: { type: "string", description: "WCAG documentation link (optional)" }
            },
            required: ["wcag_criterion", "wcag_level", "wcag_principle", "title", "description", "severity", "source", "how_to_fix"]
          }
        }
      },
      required: ["summary", "issues"]
    };

    // Create model with MCP-based tools and structured output
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction,
      tools: [{ functionDeclarations: tools }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192, // Increased to allow full responses
        responseMimeType: "application/json",
        responseSchema,
      }
    });

    // Start chat
    const chat = model.startChat();

    // Send initial message
    let result = await chat.sendMessage(userPrompt);
    let response = result.response;
    const toolCalls: MCPToolResult[] = [];

    // Handle function calling loop with maximum iteration limit
    const maxIterations = 5; // Reduced to prevent timeout
    let iteration = 0;
    let functionCalls = response.functionCalls?.() ?? [];
    
    while (functionCalls.length > 0 && iteration < maxIterations) {
      iteration++;
      console.log(`Function calling iteration ${iteration}/${maxIterations}`);
      
      const calls = functionCalls;
      const functionResponses = [];

      for (const call of calls) {
        console.log(`Gemini requesting tool: ${call.name}`);
        
        const toolResult = await executeMCPTool(clients, call.name, call.args);
        toolCalls.push(toolResult);
        
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: toolResult.result,
          },
        });
      }

      // Send function results back to model
      result = await chat.sendMessage(functionResponses);
      response = result.response;
      functionCalls = response.functionCalls?.() ?? [];
    }

    // Get final response - now guaranteed to be JSON
    const analysisText = response.text();
    console.log("Gemini response (JSON):", analysisText.substring(0, 500));
    
    // Parse JSON response
    let structuredResponse;
    try {
      structuredResponse = JSON.parse(analysisText);
    } catch (error) {
      console.error("Failed to parse Gemini JSON response:", error);
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
    };
    
  } finally {
    // Clean up MCP clients
    await cleanupMCPClients(clients);
  }
}

/**
 * Initialize all MCP servers and get their tools
 */
async function initializeMCPTools() {
  const clients: Map<string, Client> = new Map();
  const allTools: any[] = [];

  const serversDir = path.join(__dirname, "../../mcp-servers");

  // Initialize fetch-server
  try {
    const fetchClient = await initializeMCPServer(
      "fetch",
      "python3",
      [path.join(serversDir, "fetch-server/server.py")]
    );
    clients.set("fetch", fetchClient);
    
    const fetchTools = await fetchClient.listTools();
    allTools.push(...fetchTools.tools.map(t => convertMCPToolToGemini(t, "fetch")));
  } catch (error) {
    console.warn("Failed to initialize fetch-server:", error);
  }

  // Initialize wcag-docs-server
  try {
    const wcagClient = await initializeMCPServer(
      "wcag-docs",
      "python3",
      [path.join(serversDir, "wcag-docs-server/server.py")]
    );
    clients.set("wcag-docs", wcagClient);
    
    const wcagTools = await wcagClient.listTools();
    allTools.push(...wcagTools.tools.map(t => convertMCPToolToGemini(t, "wcag")));
  } catch (error) {
    console.warn("Failed to initialize wcag-docs-server:", error);
  }

  // Initialize axe-core-server
  try {
    const axeClient = await initializeMCPServer(
      "axe-core",
      "python3",
      [path.join(serversDir, "axe-core-server/server.py")]
    );
    clients.set("axe-core", axeClient);
    
    const axeTools = await axeClient.listTools();
    allTools.push(...axeTools.tools.map(t => convertMCPToolToGemini(t, "axe")));
  } catch (error) {
    console.warn("Failed to initialize axe-core-server:", error);
  }

  // Initialize document-accessibility-server
  try {
    const docAccessClient = await initializeMCPServer(
      "document-accessibility",
      "python3",
      [path.join(serversDir, "document-accessibility-server/server.py")]
    );
    clients.set("document-accessibility", docAccessClient);
    
    const docAccessTools = await docAccessClient.listTools();
    allTools.push(...docAccessTools.tools.map(t => convertMCPToolToGemini(t, "document")));
  } catch (error) {
    console.warn("Failed to initialize document-accessibility-server:", error);
  }

  return { clients, tools: allTools };
}

/**
 * Initialize a single MCP server via stdio
 */
async function initializeMCPServer(
  name: string,
  command: string,
  args: string[]
): Promise<Client> {
  const transport = new StdioClientTransport({
    command,
    args,
  });

  const client = new Client({
    name: `ally-checker-${name}`,
    version: "1.0.0",
  }, {
    capabilities: {},
  });

  await client.connect(transport);
  await client.initialize();
  
  return client;
}

/**
 * Convert MCP tool definition to Gemini function declaration format
 */
function convertMCPToolToGemini(mcpTool: any, prefix: string) {
  return {
    name: `${prefix}_${mcpTool.name}`,
    description: mcpTool.description,
    parameters: mcpTool.inputSchema || {
      type: "object",
      properties: {},
    },
  };
}

/**
 * Execute an MCP tool call
 */
async function executeMCPTool(
  clients: Map<string, Client>,
  toolName: string,
  args: any
): Promise<MCPToolResult> {
  // Extract server prefix and actual tool name
  const [prefix, ...nameParts] = toolName.split("_");
  const actualToolName = nameParts.join("_");
  
  const client = clients.get(prefix);
  
  if (!client) {
    return {
      tool: toolName,
      result: { error: `MCP server for '${prefix}' not found` },
      error: `Server not found`,
    };
  }

  try {
    const result = await client.callTool({
      name: actualToolName,
      arguments: args || {},
    });

    // Extract text content from MCP response
    const content = result.content[0];
    const text = (content as any).text || JSON.stringify(content);

    return {
      tool: toolName,
      result: { success: true, data: text },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      tool: toolName,
      result: { error: errorMessage },
      error: errorMessage,
    };
  }
}

/**
 * Clean up MCP client connections
 */
async function cleanupMCPClients(clients: Map<string, Client>) {
  for (const [name, client] of clients.entries()) {
    try {
      await client.close();
      console.log(`Closed MCP client: ${name}`);
    } catch (error) {
      console.error(`Error closing MCP client ${name}:`, error);
    }
  }
}

/**
 * Build system instruction for Gemini
 */
function buildSystemInstruction(): string {
  return `You are an expert accessibility auditor with deep knowledge of WCAG 2.2 guidelines.

**CRITICAL: Efficiency Requirements**
- You have a 60-second execution limit
- Use tools strategically: prioritize analyze_url or analyze_html first
- After automated tests, focus manual review on 4-6 most critical issues
- Do NOT repeatedly call get_wcag_criterion for every issue - reference criteria by number only
- Provide concise, actionable findings

**Available MCP Tools:**
- fetch_url: Retrieve HTML content from URLs
- fetch_url_metadata: Get HTTP headers and metadata
- analyze_html: Run axe-core automated testing on HTML
- analyze_url: Navigate to URL and analyze with axe-core
- get_wcag_criterion: Get details for a specific WCAG criterion (e.g., "1.1.1")
- search_wcag_by_principle: Search criteria by principle (Perceivable, Operable, Understandable, Robust)
- get_all_criteria: List all available WCAG criteria
- audit_pdf: Comprehensive PDF accessibility audit (PDF/UA compliance)
- audit_docx: Comprehensive DOCX accessibility audit (WCAG for documents)
- extract_pdf_structure: Get PDF outline, bookmarks, pages
- extract_docx_structure: Get DOCX headings, sections, tables
- check_pdf_tags: Verify PDF tagging (PDF/UA requirement)
- check_alt_text: Check for images and alternative text
- check_reading_order: Analyze logical reading order
- check_color_contrast: Color contrast guidance for documents

**Audit Process:**
1. For URLs: Use fetch_url or analyze_url to get content and run automated tests
2. For HTML/snippets: Use analyze_html to run axe-core tests
3. For Documents (PDF/DOCX): Use document-specific audit tools (audit_pdf, audit_docx)
4. Reference specific WCAG criteria using get_wcag_criterion for accuracy
5. Apply heuristic evaluation for issues automated tools miss:
   - Semantic HTML structure and logical document flow
   - Heading hierarchy (proper h1-h6 nesting, no skipped levels)
   - Form controls with proper labels and error identification
   - Color contrast beyond automated detection
   - Keyboard navigation patterns and tab order
   - Screen reader announcements and ARIA usage
   - Focus management and visible focus indicators
   - Landmark regions and page structure

**For Each Issue Found:**
- WCAG criterion violated (use get_wcag_criterion to get accurate info)
- Severity: critical (Level A blocker) / serious (Level AA blocker) / moderate (UX issue) / minor (enhancement)
- Specific element location (CSS selector or line number)
- Clear explanation of the problem in plain language
- Concrete remediation steps with code examples
- Link to official WCAG Understanding document

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

You MUST return a JSON object with two properties:
1. "summary": Executive summary of audit findings (string)
2. "issues": Array of accessibility issue objects

The JSON schema is enforced automatically. Each issue must include:
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
- Optional but recommended: element_selector, element_html, code_example, user_impact, how_to_reproduce, keyboard_testing, screen_reader_testing, visual_testing, expected_behavior, wcag_url

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
2. If needed, use fetch_url to examine the HTML structure
3. Cross-reference any violations with get_wcag_criterion
4. Apply manual heuristic evaluation
5. Provide comprehensive audit report with prioritized remediation steps`;
    
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
1. Use ${docType === "pdf" ? "audit_pdf" : "audit_docx"} tool for comprehensive document accessibility audit
2. Check document structure using extract_${docType}_structure
3. Verify specific requirements:
   ${docType === "pdf" 
     ? "- Tagged PDF (PDF/UA requirement) using check_pdf_tags\n   - Alternative text for images\n   - Logical reading order\n   - Form field accessibility" 
     : "- Heading hierarchy and structure\n   - Alternative text for images and objects\n   - Table accessibility\n   - Hyperlink descriptiveness"}
4. Cross-reference findings with WCAG criteria using get_wcag_criterion
5. Provide comprehensive document accessibility report with ${docType === "pdf" ? "PDF/UA" : "WCAG 2.2 AA"} remediation guidance`;
  }
}
