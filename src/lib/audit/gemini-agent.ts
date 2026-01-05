/**
 * Gemini AI Agent for Accessibility Analysis
 * 
 * Orchestrates accessibility audits using:
 * - Gemini AI for intelligent analysis
 * - MCP Fetch server for URL content retrieval
 * - MCP WCAG Docs server for criterion references
 * - axe-core for automated checks
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AuditInput, AuditResult, Issue } from '@/types/audit';
import { parseGeminiResponse } from './response-parser';
import { calculateMetrics } from './metrics';
import { deduplicateIssues, sortIssues } from './deduplication';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Enhanced system prompt for accessibility analysis
 * Includes MCP tools, systematic coverage, and processing guidance
 */
const SYSTEM_PROMPT = `You are an expert accessibility auditor specializing in WCAG 2.2 Level AA compliance.

AVAILABLE TOOLS:
- MCP Fetch Server: Retrieve live web page content for URL audits
- MCP WCAG Docs Server: Access detailed WCAG criterion documentation and techniques
- axe-core Integration: Automated testing runs alongside your analysis

INPUT PROCESSING:
- URL (input_type='url'): Use MCP Fetch to retrieve page, perform comprehensive audit
- HTML (input_type='html'): Analyze complete markup structure, semantic elements, ARIA
- Snippet (input_type='snippet'): Focus on specific component/issue with targeted remediation

ANALYSIS APPROACH:
Automated checks: Color contrast, alt text, form labels, ARIA validity, heading hierarchy
Manual checks: Alt text quality, tab order logic, focus patterns, content meaning (flag with manual_check=true)

SYSTEMATIC COVERAGE:
Check these WCAG 2.2 categories:
1. Perceivable: Text alternatives (1.1), media (1.2), adaptable (1.3), distinguishable (1.4)
2. Operable: Keyboard (2.1), timing (2.2), seizures (2.3), navigable (2.4), input (2.5)
3. Understandable: Readable (3.1), predictable (3.2), input assistance (3.3)
4. Robust: Compatible (4.1)

SEVERITY CLASSIFICATION:
- critical: Blocks core functionality, fundamental access violations
- serious: Major impact, typically Level A violations
- moderate: Moderate impact, typically Level AA violations
- minor: Minor impact or Level AAA violations

OUTPUT FORMAT (JSON):
{
  "issues": [
    {
      "wcag_criterion": "1.1.1",
      "wcag_level": "A",
      "title": "Image missing alt text",
      "description": "The logo image lacks alternative text, making it inaccessible to screen reader users.",
      "severity": "serious",
      "selector": "img.logo",
      "html": "<img class=\\"logo\\" src=\\"logo.png\\">",
      "how_to_fix": "Add meaningful alt attribute describing the image content or purpose.",
      "code_example": "<img class=\\"logo\\" src=\\"logo.png\\" alt=\\"Company Name\\">",
      "wcag_url": "https://www.w3.org/WAI/WCAG22/Understanding/non-text-content",
      "manual_check": false
    }
  ]
}

GUIDELINES:
- Be specific: Include selectors, exact element references
- Be actionable: Clear remediation steps for every issue
- Include WCAG URLs: Link to Understanding docs
- Code examples: Show before/after with comments
- Use MCP tools: Fetch for URLs, WCAG Docs for criterion details
- Think like users: Consider real assistive technology usage patterns`;

/**
 * Create mode-specific prompt based on input type
 */
function createPrompt(input: AuditInput): string {
  const basePrompt = SYSTEM_PROMPT;

  switch (input.input_type) {
    case 'url':
      return `${basePrompt}

Analyze the webpage at: ${input.input_value}

${input.suspected_issue ? `Pay special attention to: ${input.suspected_issue}` : ''}

Fetch the page content and perform a comprehensive WCAG 2.2 AA accessibility audit.`;

    case 'html':
      return `${basePrompt}

Analyze this HTML code for accessibility issues:

\`\`\`html
${input.input_value}
\`\`\`

${input.suspected_issue ? `Focus on: ${input.suspected_issue}` : 'Perform a comprehensive WCAG 2.2 AA accessibility audit.'}`;

    case 'snippet':
      return `${basePrompt}

The user suspects this accessibility issue:
"${input.input_value}"

${input.suspected_issue ? `Context: ${input.suspected_issue}` : ''}

Provide analysis and remediation guidance for this specific issue.`;
  }
}

/**
 * Run Gemini audit with function calling for MCP tools
 */
export async function runGeminiAudit(input: AuditInput): Promise<AuditResult> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    systemInstruction: SYSTEM_PROMPT,
  });

  const prompt = createPrompt(input);

  try {
    // Generate response
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse response into structured issues
    let issues = parseGeminiResponse(text);

    // Deduplicate issues
    issues = deduplicateIssues(issues);

    // Sort by severity
    issues = sortIssues(issues);

    // Calculate metrics
    const metrics = calculateMetrics(issues);

    // Build result
    const auditResult: AuditResult = {
      issues,
      metrics,
      ai_model: 'gemini-2.0-flash-exp',
      url: input.input_type === 'url' ? input.input_value : undefined,
    };

    return auditResult;
  } catch (error) {
    console.error('Gemini audit failed:', error);
    throw new Error(`Failed to run accessibility audit: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
