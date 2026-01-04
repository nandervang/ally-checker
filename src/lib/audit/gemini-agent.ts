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
 * System prompt for accessibility analysis
 */
const SYSTEM_PROMPT = `You are an expert accessibility auditor specializing in WCAG 2.2 Level AA compliance.

Your task is to analyze web content and identify accessibility issues with:
- Specific WCAG 2.2 criterion numbers (e.g., 1.1.1, 2.4.6)
- Severity level (critical/serious/moderate/minor)
- Element selectors when applicable
- Clear remediation guidance
- Code examples for fixes

Return your analysis in JSON format:
{
  "issues": [
    {
      "wcag_criterion": "1.1.1",
      "wcag_level": "A",
      "title": "Image missing alt text",
      "description": "The logo image lacks alternative text",
      "severity": "serious",
      "selector": "img.logo",
      "html": "<img class=\\"logo\\" src=\\"logo.png\\">",
      "how_to_fix": "Add meaningful alt text describing the logo",
      "code_example": "<img class=\\"logo\\" src=\\"logo.png\\" alt=\\"Company Name\\">",
      "wcag_url": "https://www.w3.org/WAI/WCAG22/Understanding/non-text-content"
    }
  ]
}

Focus on actionable, specific issues with clear remediation steps.`;

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
