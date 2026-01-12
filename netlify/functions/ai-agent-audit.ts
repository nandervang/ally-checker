import type { Handler, HandlerEvent } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { runGeminiAudit } from "./gemini-agent";
import { validateApiKey, getCorsHeaders, createAuthErrorResponse } from "./lib/auth";
import type { Database } from "../../src/types/database";

interface AuditRequest {
  mode: "url" | "html" | "snippet" | "document";
  content: string;
  model: "claude" | "gemini" | "gpt4";
  geminiModel?: "gemini-2.5-flash" | "gemini-2.5-pro"; // Specific Gemini variant
  language?: string;
  documentType?: "pdf" | "docx";
  filePath?: string;
  userId?: string;
  sessionId?: string;
}

interface MCPToolResult {
  tool: string;
  result: unknown;
  error?: string;
}

/**
 * AI Agent Audit Function
 * 
 * This Netlify Function orchestrates AI-powered accessibility audits using:
 * 1. MCP servers for tool execution (fetch, wcag-docs, axe-core)
 * 2. AI models (Claude, Gemini, GPT-4) for intelligent analysis
 * 3. Heuristic evaluation beyond automated testing
 * 
 * Authentication: Requires X-Report-Service-Key header (if REPORT_SERVICE_KEY env var is set)
 */
export const handler: Handler = async (event: HandlerEvent) => {
  const headers = getCorsHeaders();

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  // Only accept POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Validate authentication
  const auth = validateApiKey(event);
  if (!auth.isAuthenticated) {
    return createAuthErrorResponse(auth.error!);
  }

  try {
    const body = event.body ?? "{}";
    const request = JSON.parse(body) as AuditRequest;
    
    // Validate request
    if (!request.content || !request.mode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields: content, mode" }),
      };
    }

    // Get user ID from Authorization header (Supabase JWT)
    const authHeader = event.headers.authorization || event.headers.Authorization;
    let userId: string | undefined;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Decode JWT to get user ID (simple decode, not verifying signature)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
      } catch (e) {
        console.warn('Failed to decode JWT:', e);
      }
    }

    // Route to appropriate AI model
    const result = await runAIAudit(request);

    // Save to Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase not configured');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ...result, auditId: null }),
      };
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseKey);

    // Create audit record with methodology trace
    const { data: auditData, error: auditError } = await supabase
      .from('audits')
      .insert({
        user_id: userId || null,
        session_id: request.sessionId || null,
        input_type: request.mode,
        input_value: request.content,
        url: request.mode === 'url' ? request.content : null,
        document_path: request.filePath || null,
        document_type: request.documentType || null,
        status: 'complete',
        completed_at: new Date().toISOString(),
        total_issues: result.summary.totalIssues || 0,
        critical_issues: result.summary.criticalCount || 0,
        serious_issues: result.summary.seriousCount || 0,
        moderate_issues: result.summary.moderateCount || 0,
        minor_issues: result.summary.minorCount || 0,
        perceivable_issues: 0,
        operable_issues: 0,
        understandable_issues: 0,
        robust_issues: 0,
        // Audit methodology trace
        audit_methodology: result.auditMethodology || {},
        mcp_tools_used: result.mcpToolsUsed || [],
        sources_consulted: result.sourcesConsulted || [],
      })
      .select('id')
      .single();

    if (auditError) {
      console.error('Failed to save audit:', auditError);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ...result, auditId: null }),
      };
    }

    const auditId = auditData.id;

    // Debug: Log what we received from AI agent
    console.log('Result from AI agent:', {
      has_issues: !!result.issues,
      issues_length: result.issues?.length || 0,
      issues_keys: result.issues ? Object.keys(result.issues[0] || {}) : [],
      total_issues_from_summary: result.summary.totalIssues
    });

    // Save issues if any
    if (result.issues && result.issues.length > 0) {
      const issuesData = result.issues.map((issue: any) => ({
        audit_id: auditId,
        wcag_criterion: issue.wcag_criterion || issue.criterion || issue.wcagCriterion || '',
        wcag_level: issue.wcag_level || 'AA',
        wcag_principle: issue.wcag_principle || 'perceivable',
        severity: issue.severity || 'moderate',
        title: issue.title || issue.description || '',
        description: issue.description || issue.explanation || '',
        source: issue.source || 'ai-heuristic',
        confidence_score: issue.confidence_score,
        element_selector: issue.element_selector || issue.selector || issue.element || null,
        element_html: issue.element_html || issue.html || null,
        element_context: issue.element_context || null,
        how_to_fix: issue.how_to_fix || issue.remediation || issue.fix || 'Review WCAG guidelines for remediation steps.',
        code_example: issue.code_example || issue.code || issue.codeSnippet || null,
        wcag_url: issue.wcag_url || issue.wcagUrl || issue.helpUrl || null,
        // ETU Swedish report fields
        wcag_explanation: issue.wcag_explanation || null,
        how_to_reproduce: issue.how_to_reproduce || null,
        user_impact: issue.user_impact || null,
        fix_priority: issue.fix_priority || (issue.severity === 'critical' ? 'MÅSTE' : issue.severity === 'serious' ? 'BÖR' : 'KAN'),
        en_301_549_ref: issue.en_301_549_ref || null,
        webbriktlinjer_url: issue.webbriktlinjer_url || null,
        screenshot_url: issue.screenshot_url || null,
        // Testing methodology fields
        keyboard_testing: issue.keyboard_testing || null,
        screen_reader_testing: issue.screen_reader_testing || null,
        visual_testing: issue.visual_testing || null,
        expected_behavior: issue.expected_behavior || null,
      }));

      console.log(`Attempting to save ${issuesData.length} issues for audit ${auditId}`);
      console.log('First issue sample:', JSON.stringify(issuesData[0], null, 2));
      
      const { data: insertedIssues, error: issuesError } = await supabase
        .from('issues')
        .insert(issuesData)
        .select();

      if (issuesError) {
        console.error('Failed to save issues:', issuesError);
        console.error('Issue data that failed:', JSON.stringify(issuesData, null, 2));
        // Don't throw - return audit ID anyway, but log the error
      } else {
        console.log(`Successfully saved ${insertedIssues?.length || 0} issues`);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ...result, auditId }),
    };
  } catch (error) {
    console.error("AI Agent Audit Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};

/**
 * Run AI-powered audit using the selected model
 */
async function runAIAudit(request: AuditRequest) {
  switch (request.model) {
    case "claude":
      return await runClaudeAudit(request);
    case "gemini":
      return await runGeminiAudit(request);
    case "gpt4":
      throw new Error("GPT-4 integration not yet implemented");
    default: {
      const _exhaustive: never = request.model;
      throw new Error(`Unsupported model: ${String(_exhaustive)}`);
    }
  }
}

/**
 * Run audit using Claude with MCP tools
 */
async function runClaudeAudit(request: AuditRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const client = new Anthropic({ apiKey });

  // Prepare system prompt for accessibility audit
  const systemPrompt = `You are an expert accessibility auditor with deep knowledge of WCAG 2.2 guidelines.

Your task is to perform a comprehensive accessibility audit that goes beyond automated testing:

1. Use the axe-core MCP tool to run automated tests
2. Use the wcag-docs MCP tool to reference specific WCAG criteria
3. Apply heuristic evaluation for issues automated tools miss:
   - Semantic HTML structure
   - Logical heading hierarchy
   - Form label associations
   - Color contrast in context
   - Keyboard navigation patterns
   - Screen reader compatibility
   - Focus management
   - Error identification and suggestions

For each issue found, provide:
- WCAG criterion violated (reference wcag-docs tool)
- Severity (critical/serious/moderate/minor)
- Specific element and location
- Clear explanation of the problem
- Concrete remediation steps
- Code examples where helpful

Focus on actionable insights that help developers fix issues effectively.`;

  // Build user prompt based on mode
  let userPrompt = "";
  switch (request.mode) {
    case "url":
      userPrompt = `Audit the accessibility of this URL: ${request.content}

Steps:
1. Use fetch_url to retrieve the page HTML
2. Use analyze_html to run axe-core tests
3. Manually review the HTML structure for issues automated tools miss
4. Cross-reference issues with WCAG criteria using wcag-docs tools
5. Provide comprehensive audit report`;
      break;
    
    case "html":
      userPrompt = `Audit the accessibility of this HTML content:

\`\`\`html
${request.content}
\`\`\`

Steps:
1. Use analyze_html to run axe-core tests
2. Manually review the HTML structure for issues automated tools miss
3. Cross-reference issues with WCAG criteria using wcag-docs tools
4. Provide comprehensive audit report`;
      break;
    
    case "snippet":
      userPrompt = `Audit the accessibility of this code snippet:

\`\`\`html
${request.content}
\`\`\`

Steps:
1. Use analyze_html to run axe-core tests on the snippet
2. Manually review for accessibility issues
3. Cross-reference with WCAG criteria using wcag-docs tools
4. Provide focused audit report`;
      break;
  }

  // TODO: Integrate MCP tools when Claude Desktop/API supports MCP
  // For now, we'll use Claude without tools and note the limitation
  
  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  // Extract text from response
  const analysisText = response.content
    .filter((block): block is { type: "text"; text: string } => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  // Parse Claude's response into structured audit result
  // TODO: Implement proper parsing of Claude's markdown/text response
  // For now, return a basic structure
  
  return {
    summary: {
      url: request.mode === "url" ? request.content : undefined,
      timestamp: new Date().toISOString(),
      totalIssues: 0, // Will be parsed from response
      criticalCount: 0,
      seriousCount: 0,
      moderateCount: 0,
      minorCount: 0,
      passCount: 0,
      model: "claude-3-5-sonnet",
    },
    issues: [], // Will be parsed from response
    wcagCompliance: {
      levelA: { passed: 0, failed: 0, percentage: 0 },
      levelAA: { passed: 0, failed: 0, percentage: 0 },
      levelAAA: { passed: 0, failed: 0, percentage: 0 },
    },
    rawAnalysis: analysisText,
    toolResults: [] as MCPToolResult[],
  };
}
