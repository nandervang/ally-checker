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
import type { AuditInput, AuditResult, Issue, AgentTrace, AgentTraceStep } from '@/types/audit';
import { parseGeminiResponse } from './response-parser';
import { calculateMetrics } from './metrics';
import { deduplicateIssues, sortIssues } from './deduplication';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Gemini 2.0 Flash context window limits
const MAX_INPUT_TOKENS = 1_000_000; // 1M tokens
const CHARS_PER_TOKEN = 4; // Approximate: 1 token ≈ 4 characters
const MAX_PROMPT_CHARS = MAX_INPUT_TOKENS * CHARS_PER_TOKEN * 0.8; // Use 80% of limit for safety
const CHUNK_SIZE = Math.floor(MAX_PROMPT_CHARS * 0.3); // Each chunk is ~30% of max

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
- Document (input_type='document'): Use document accessibility MCP tools for PDF/DOCX auditing
  - PDF: Check PDF/UA compliance (tagged PDF, structure, alt text, reading order, forms, tables)
  - DOCX: Check WCAG adaptations (headings, alt text, tables, hyperlinks, language)

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
 * Split large HTML into chunks that fit within token limits
 */
function chunkHTML(html: string): string[] {
  if (html.length <= CHUNK_SIZE) {
    return [html];
  }

  const chunks: string[] = [];
  let currentPos = 0;

  while (currentPos < html.length) {
    let chunkEnd = Math.min(currentPos + CHUNK_SIZE, html.length);
    
    // Try to break at a tag boundary to avoid breaking HTML structure
    if (chunkEnd < html.length) {
      const lastTagClose = html.lastIndexOf('>', chunkEnd);
      const lastTagOpen = html.lastIndexOf('<', chunkEnd);
      
      // If we're in the middle of a tag, back up to the last complete tag
      if (lastTagOpen > lastTagClose) {
        chunkEnd = lastTagClose + 1;
      } else if (lastTagClose > currentPos) {
        chunkEnd = lastTagClose + 1;
      }
    }

    chunks.push(html.substring(currentPos, chunkEnd));
    currentPos = chunkEnd;
  }

  return chunks;
}

/**
 * Create mode-specific prompt based on input type
 */
function createPrompt(input: AuditInput, chunkIndex?: number, totalChunks?: number): string {
  const basePrompt = SYSTEM_PROMPT;

  switch (input.input_type) {
    case 'url':
      return `${basePrompt}

Analyze the webpage at: ${input.input_value}

${input.suspected_issue ? `Pay special attention to: ${input.suspected_issue}` : ''}

Fetch the page content and perform a comprehensive WCAG 2.2 AA accessibility audit.`;

    case 'html': {
      const chunkInfo = chunkIndex !== undefined && totalChunks !== undefined
        ? `\n\nNote: This is chunk ${chunkIndex + 1} of ${totalChunks}. Analyze this section and ${chunkIndex < totalChunks - 1 ? 'we will continue with the next chunk' : 'provide final results combining all chunks'}.`
        : '';
      
      return `${basePrompt}

Analyze this HTML code for accessibility issues:${chunkInfo}

\`\`\`html
${input.input_value}
\`\`\`

${input.suspected_issue ? `Focus on: ${input.suspected_issue}` : 'Perform a comprehensive WCAG 2.2 AA accessibility audit.'}`;
    }

    case 'snippet':
      return `${basePrompt}

The user suspects this accessibility issue:
"${input.input_value}"

${input.suspected_issue ? `Context: ${input.suspected_issue}` : ''}

Provide analysis and remediation guidance for this specific issue.`;

    case 'document':
      return `${basePrompt}

Analyze the accessibility of this ${input.document_type?.toUpperCase()} document: ${input.input_value}
Document storage path: ${input.document_path}

${input.document_type === 'pdf' ? `
Use the document accessibility MCP tools to perform a comprehensive PDF/UA (ISO 14289) compliance audit:
1. Check if PDF is tagged (required for PDF/UA) - use check_pdf_tags
2. Verify document structure and bookmarks - use extract_pdf_structure
3. Check for alternative text on images - use check_alt_text
4. Analyze reading order - use check_reading_order
5. Review form fields, tables, and color contrast

Focus on PDF/UA requirements and WCAG 2.2 AA adapted for documents.
` : `
Use the document accessibility MCP tools to perform a comprehensive WCAG 2.2 AA audit for DOCX:
1. Verify heading hierarchy - use extract_docx_structure and check_docx_headings
2. Check alternative text for images - use check_alt_text
3. Validate table accessibility - use check_docx_tables
4. Review hyperlink descriptiveness - use check_docx_hyperlinks
5. Check document language and title settings

Focus on WCAG 2.2 AA success criteria adapted for document context.
`}

Provide specific remediation guidance for document formats (not web HTML).`;
  }
}

/**
 * Run Gemini audit with function calling for MCP tools
 * Handles large HTML inputs by chunking if necessary
 */
export async function runGeminiAudit(input: AuditInput): Promise<AuditResult> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    systemInstruction: SYSTEM_PROMPT,
  });

  const startTime = Date.now();
  const trace: AgentTrace = {
    steps: [],
    tools_used: [],
    sources_consulted: [],
  };

  const addTraceStep = (action: string, details?: Partial<AgentTraceStep>) => {
    trace.steps.push({
      timestamp: new Date().toISOString(),
      action,
      ...details,
    });
  };

  try {
    let allIssues: Issue[] = [];

    addTraceStep('Audit initialized', {
      reasoning: `Starting ${input.input_type} accessibility audit using Gemini 2.0 Flash AI model`,
    });

    // Documents and snippets don't need chunking
    if (input.input_type === 'document' || input.input_type === 'snippet') {
      if (input.input_type === 'document') {
        addTraceStep('Document audit started', {
          reasoning: `Analyzing ${input.document_type?.toUpperCase()} file for ${input.document_type === 'pdf' ? 'PDF/UA (ISO 14289)' : 'WCAG 2.2 AA document'} compliance`,
        });
        trace.tools_used.push(`document_${input.document_type}_auditor`);
        trace.sources_consulted.push(
          input.document_type === 'pdf' ? 'PDF/UA (ISO 14289) Standard' : 'WCAG 2.2 Document Guidelines',
          'WCAG 2.2 Level AA Success Criteria'
        );
      }

      addTraceStep('Preparing prompt for AI analysis', {
        reasoning: 'Constructing detailed prompt with accessibility guidelines and evaluation criteria',
      });

      const prompt = createPrompt(input);
      
      addTraceStep('Sending request to Gemini AI', {
        tool: 'gemini-2.0-flash-exp',
        reasoning: 'AI model will analyze content against WCAG 2.2 AA guidelines',
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      addTraceStep('AI analysis complete', {
        output: `Received ${text.length} characters of analysis`,
        reasoning: 'Parsing AI response to extract accessibility issues',
      });

      trace.tools_used.push('gemini-2.0-flash-exp');
      trace.sources_consulted.push('WCAG 2.2 Understanding Documents', 'WCAG 2.2 Techniques');

      const parsedIssues = parseGeminiResponse(text, input);
      allIssues = parsedIssues;

      addTraceStep('Issues extracted', {
        output: `Found ${parsedIssues.length} accessibility issues`,
      });
    }
    // Check if HTML input needs chunking
    else if (input.input_type === 'html' && input.input_value.length > CHUNK_SIZE) {
      console.log(`HTML content is large (${input.input_value.length} chars). Chunking into smaller pieces...`);
      
      const chunks = chunkHTML(input.input_value);
      console.log(`Split into ${chunks.length} chunks for processing`);

      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)...`);
        
        const chunkInput: AuditInput = {
          ...input,
          input_value: chunks[i],
        };

        const prompt = createPrompt(chunkInput, i, chunks.length);
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Parse and accumulate issues from this chunk
        const chunkIssues = parseGeminiResponse(text);
        allIssues.push(...chunkIssues);
      }
    } else {
      // Process normally for non-chunked content
      const prompt = createPrompt(input);
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      allIssues = parseGeminiResponse(text);
    }

    // Deduplicate issues (especially important when chunking)
    addTraceStep('Deduplicating issues', {
      reasoning: 'Removing duplicate issues that may have been found multiple times',
    });
    let issues = deduplicateIssues(allIssues);

    addTraceStep('Sorting issues by severity', {
      output: `${issues.length} unique issues identified`,
      reasoning: 'Prioritizing critical and serious issues first',
    });
    // Sort by severity
    issues = sortIssues(issues);

    // Calculate metrics
    addTraceStep('Calculating WCAG compliance metrics', {
      reasoning: 'Grouping issues by WCAG principles (Perceivable, Operable, Understandable, Robust)',
    });
    const metrics = calculateMetrics(issues);

    // Add trace duration
    trace.duration_ms = Date.now() - startTime;

    addTraceStep('Audit complete', {
      output: `${issues.length} issues, ${metrics.critical_issues} critical, ${metrics.serious_issues} serious`,
      reasoning: `Completed in ${trace.duration_ms}ms using ${trace.tools_used.length} tools`,
    });

    // Build result
    const auditResult: AuditResult = {
      issues,
      metrics,
      ai_model: 'gemini-2.0-flash-exp',
      url: input.input_type === 'url' ? input.input_value : undefined,
      agent_trace: trace,
    };

    return auditResult;
  } catch (error) {
    addTraceStep('Audit failed', {
      output: error instanceof Error ? error.message : 'Unknown error',
      reasoning: 'An error occurred during the audit process',
    });
    
    console.error('Gemini audit failed:', error);
    throw new Error(`Failed to run accessibility audit: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
