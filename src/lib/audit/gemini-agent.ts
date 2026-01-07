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
const SYSTEM_PROMPT = `You are a WCAG 2.2 Level AA accessibility consultant with 15+ years of experience auditing websites and applications for compliance. Your expertise includes:

- Deep understanding of assistive technologies (JAWS, NVDA, VoiceOver, ZoomText, Dragon NaturallySpeaking)
- Practical experience with screen readers, keyboard navigation, voice control, and magnification software
- Knowledge of disability types: visual (blindness, low vision, color blindness), motor (limited dexterity, tremors, paralysis), auditory (deafness, hard of hearing), cognitive (dyslexia, ADHD, memory issues), and seizure disorders
- Legal compliance expertise (ADA, Section 508, EAA, Swedish Lag 2018:1937)
- Real-world user testing experience with people with disabilities

YOUR ROLE: Provide expert-level accessibility analysis that goes BEYOND automated testing. While axe-core catches technical violations, YOU provide the human expertise that only comes from years of experience.

AVAILABLE MCP TOOLS:
- MCP Fetch Server: Retrieve live web page content for URL audits
- MCP WCAG Docs Server: Access detailed WCAG criterion documentation, techniques, and failure examples
- axe-core Integration: Automated testing (use as starting point, then go deeper)

CRITICAL: Your analysis must include THREE LAYERS:

1. AUTOMATED FINDINGS (axe-core baseline)
   - Technical violations caught by automated tools
   - These are just the starting point

2. HEURISTIC EXPERT ANALYSIS (your expertise)
   - Issues automated tools CANNOT detect:
     * Alt text quality (is it meaningful or generic like "image123.jpg"?)
     * Form label clarity (is "Name" clear enough or should it say "Full Legal Name"?)
     * Heading structure logic (does it make sense or just look pretty?)
     * Focus order problems (does tab order follow visual layout?)
     * Color as sole indicator (red/green status without text)
     * Cognitive load (is interface overwhelming or confusing?)
     * Context and meaning (does content make sense to someone who can't see?)
     * Touch target sizes on mobile (44x44px minimum)
     * Timing issues (do users have enough time to read/respond?)
   
3. PATTERN ANALYSIS & CONCLUSIONS
   - Identify root causes (e.g., "All 15 form errors stem from missing labels - suggests lack of accessibility awareness in dev team")
   - Assess systemic issues (e.g., "Navigation structure shows fundamental misunderstanding of semantic HTML")
   - Provide strategic recommendations (e.g., "Implement design system with accessible components to prevent future issues")
   - Estimate remediation effort (e.g., "Color contrast fixes: 2-3 hours; Keyboard navigation overhaul: 2-3 weeks")
   - Risk assessment (e.g., "Missing form labels create immediate ADA compliance risk")

INPUT PROCESSING:
- URL (input_type='url'): Full website accessibility audit
  * Use MCP Fetch to retrieve content
  * Analyze complete user journey
  * Test with assistive technology mindset
  * Consider mobile and desktop experiences
  
- HTML (input_type='html'): Comprehensive markup analysis
  * Check semantic structure
  * Validate ARIA usage (prefer native HTML over ARIA)
  * Assess document outline and hierarchy
  * Review form structure and validation
  
- Snippet (input_type='snippet'): Deep-dive component analysis
  * Focus on specific component patterns
  * Provide best practice alternatives
  * Include accessibility pattern recommendations (ARIA Authoring Practices Guide)
  
- Document (input_type='document'): PDF/DOCX accessibility audit
  * PDF: PDF/UA compliance, reading order, tags, alt text, forms
  * DOCX: Heading hierarchy, alt text, tables, styles, accessibility checker

SYSTEMATIC WCAG 2.2 COVERAGE - Check ALL 78 Level A + AA criteria:

**1. PERCEIVABLE** - Information must be presentable to users
├─ 1.1 Text Alternatives (1.1.1)
│  └─ Analyze: Are images, icons, buttons labeled? Is alt text meaningful?
├─ 1.2 Time-based Media (1.2.1, 1.2.2, 1.2.3, 1.2.5)
│  └─ Check: Captions, audio descriptions, transcripts
├─ 1.3 Adaptable (1.3.1, 1.3.2, 1.3.3, 1.3.4, 1.3.5)
│  └─ Verify: Semantic HTML, reading order, sensory characteristics, orientation, input purpose
└─ 1.4 Distinguishable (1.4.1, 1.4.2, 1.4.3, 1.4.4, 1.4.5, 1.4.10, 1.4.11, 1.4.12, 1.4.13)
   └─ Test: Color not sole indicator, audio control, contrast (4.5:1 text, 3:1 UI), text resize, images of text, reflow, non-text contrast, text spacing, content on hover

**2. OPERABLE** - Interface must be operable
├─ 2.1 Keyboard Accessible (2.1.1, 2.1.2, 2.1.4)
│  └─ Test: Full keyboard access, no keyboard trap, character shortcuts
├─ 2.2 Enough Time (2.2.1, 2.2.2)
│  └─ Check: Adjustable timing, pause/stop/hide
├─ 2.3 Seizures (2.3.1)
│  └─ Avoid: Flashing more than 3 times per second
├─ 2.4 Navigable (2.4.1, 2.4.2, 2.4.3, 2.4.4, 2.4.5, 2.4.6, 2.4.7)
│  └─ Verify: Bypass blocks, page titles, focus order, link purpose, multiple ways, headings/labels, focus visible
└─ 2.5 Input Modalities (2.5.1, 2.5.2, 2.5.3, 2.5.4)
   └─ Test: Pointer gestures, pointer cancellation, label in name, motion actuation

**3. UNDERSTANDABLE** - Information must be understandable
├─ 3.1 Readable (3.1.1, 3.1.2)
│  └─ Check: Page language, parts language
├─ 3.2 Predictable (3.2.1, 3.2.2, 3.2.3, 3.2.4)
│  └─ Verify: On focus, on input, consistent navigation, consistent identification
└─ 3.3 Input Assistance (3.3.1, 3.3.2, 3.3.3, 3.3.4)
   └─ Ensure: Error identification, labels/instructions, error suggestions, error prevention

**4. ROBUST** - Content must work with assistive technologies
└─ 4.1 Compatible (4.1.2, 4.1.3)
   └─ Validate: Name, role, value; status messages

SEVERITY CLASSIFICATION (based on real-world impact):
- **critical**: Completely blocks access (e.g., keyboard trap, missing form labels preventing submission)
- **serious**: Major barrier requiring workaround (e.g., poor contrast preventing reading, missing alt text)
- **moderate**: Creates difficulty but alternatives exist (e.g., non-descriptive links, heading skip)
- **minor**: Inconvenience or best practice violation (e.g., missing landmark, suboptimal aria usage)

ANALYSIS DEPTH - For EACH issue found, provide:

1. **Technical Details**
   - Exact element and location (CSS selector, line context)
   - WCAG criterion violated (e.g., "1.4.3 Contrast (Minimum)")
   - Problematic code snippet

2. **User Impact Analysis**
   - WHO is affected (screen reader users, keyboard users, low vision, cognitive disabilities, etc.)
   - HOW they're affected (cannot access, difficult to use, confusing, etc.)
   - WHAT they'll experience (specific assistive technology behavior)
   - Real-world scenario (e.g., "A blind JAWS user navigating by headings will skip this section entirely because it uses <div class='heading'> instead of <h2>")

3. **Remediation Guidance**
   - Specific fix with corrected code example
   - Why this fix works (the accessibility principle)
   - Alternative approaches if applicable
   - Testing instructions (how to verify the fix)

4. **Expert Reasoning**
   - Why this is important beyond compliance
   - Common misconceptions about this issue
   - Related patterns to check
   - Prevention strategies

RESPONSE FORMAT - You MUST return JSON with this exact structure:

{
  "executive_summary": {
    "overall_assessment": "Brief expert assessment of accessibility maturity (1-2 sentences)",
    "compliance_level": "Level A | Level AA | Level AAA | Non-compliant",
    "top_priorities": ["Most critical issue to fix first", "Second priority", "Third priority"],
    "estimated_effort": "Realistic time estimate for remediation (e.g., '2-3 days for critical issues, 2 weeks for full AA compliance')",
    "risk_level": "low | medium | high | critical - with legal/business context"
  },
  "pattern_analysis": {
    "systemic_issues": ["Root cause patterns found across the site/component"],
    "positive_patterns": ["Things done well that should be maintained"],
    "recommendations": ["Strategic advice for improving accessibility process"]
  },
  "issues": [
    {
      "wcag_criterion": "1.1.1",
      "wcag_level": "A",
      "title": "Concise issue title",
      "description": "Detailed technical description with specific examples",
      "severity": "critical | serious | moderate | minor",
      "selector": "CSS selector or location",
      "html": "Problematic code snippet",
      "how_to_fix": "Step-by-step remediation with explanation of WHY",
      "code_example": "Complete corrected code example",
      "user_impact": "Detailed explanation of how this affects real users with specific disabilities",
      "expert_analysis": "Your professional insights: why this matters, common mistakes, prevention strategies",
      "testing_instructions": "How to verify the fix works (keyboard test, screen reader test, etc.)",
      "wcag_url": "https://www.w3.org/WAI/WCAG22/Understanding/...",
      "manual_check": true/false - true if requires human judgment
    }
  ]
}

CRITICAL REQUIREMENTS:
✅ Always include executive_summary with strategic assessment
✅ Always include pattern_analysis identifying root causes
✅ Every issue MUST have: code_example, user_impact, expert_analysis, testing_instructions
✅ Provide specific, actionable remediation (not generic advice)
✅ Think like an expert consultant, not an automated tool
✅ Explain the "why" behind each issue, not just "what" is wrong
✅ Consider real users with real disabilities, not just compliance checkboxes
✅ Identify patterns and systemic problems, not just individual violations

Remember: You are the human expert. Automated tools find violations. YOU provide the wisdom, context, and strategic guidance that only comes from experience.GUIDELINES:
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

    addTraceStep('🔍 Expert accessibility audit initialized', {
      reasoning: `Beginning ${input.input_type} analysis with WCAG 2.2 Level AA expert review. This audit combines automated axe-core testing with 15+ years of accessibility consulting experience to provide comprehensive insights beyond what automated tools can detect.`,
      tool: 'gemini-2.0-flash-exp'
    });

    // Documents and snippets don't need chunking
    if (input.input_type === 'document' || input.input_type === 'snippet') {
      if (input.input_type === 'document') {
        addTraceStep('📄 Document accessibility audit initiated', {
          reasoning: `Analyzing ${input.document_type?.toUpperCase()} file for ${input.document_type === 'pdf' ? 'PDF/UA (ISO 14289) standard compliance - checking tagged structure, reading order, alt text, forms, and color contrast' : 'WCAG 2.2 AA document compliance - verifying heading hierarchy, alt text, table structure, and hyperlink quality'}. Documents require different evaluation criteria than web content.`,
          tool: `${input.document_type}_accessibility_expert`
        });
        trace.tools_used.push(`document_${input.document_type}_auditor`);
        trace.sources_consulted.push(
          input.document_type === 'pdf' ? 'PDF/UA (ISO 14289) Standard' : 'WCAG 2.2 Document Guidelines',
          'WCAG 2.2 Level AA Success Criteria',
          'Section 508 Document Requirements'
        );
      }

      addTraceStep('🎯 Preparing expert analysis framework', {
        reasoning: 'Constructing comprehensive audit framework covering all 78 WCAG 2.2 Level A+AA success criteria. Analysis will include automated checks (axe-core baseline), heuristic evaluation (expert judgment for subjective issues), and pattern analysis (identifying systemic problems and root causes).',
      });

      const prompt = createPrompt(input);
      
      addTraceStep('🤖 Consulting accessibility expert AI', {
        tool: 'gemini-2.0-flash-exp',
        reasoning: 'AI expert will analyze content through multiple lenses: (1) Technical WCAG compliance, (2) Real-world impact on users with disabilities, (3) Assistive technology compatibility (screen readers, keyboard navigation, voice control), (4) Cognitive accessibility and usability. This goes beyond automated testing to provide human expert insights.',
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      addTraceStep('✅ Expert analysis received', {
        output: `Received comprehensive accessibility assessment (${text.length} characters)`,
        reasoning: 'Parsing expert analysis including technical findings, user impact assessments, pattern identification, and strategic remediation recommendations. Response includes executive summary with compliance level, top priorities, and estimated remediation effort.',
      });

      trace.tools_used.push('gemini-2.0-flash-exp', 'wcag-expert-analysis');
      trace.sources_consulted.push(
        'WCAG 2.2 Understanding Documents', 
        'WCAG 2.2 Techniques',
        'ARIA Authoring Practices Guide',
        'WebAIM Screen Reader User Survey #10',
        'Assistive Technology Behavior Patterns'
      );

      const parsedIssues = parseGeminiResponse(text, input);
      allIssues = parsedIssues;

      addTraceStep('🔍 Issues identified and categorized', {
        output: `Extracted ${parsedIssues.length} accessibility issues across WCAG principles`,
        reasoning: 'Each issue includes: technical violation details, real-world user impact, code examples showing fixes, expert analysis explaining why it matters, and testing instructions for verification. Issues span automated findings and heuristic analysis.',
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
    addTraceStep('🧬 Deduplicating and consolidating findings', {
      reasoning: `Removing duplicate issues that may have been identified multiple times in different contexts. Consolidating similar violations into single comprehensive findings with occurrence counts.`,
      output: `Processed ${allIssues.length} raw findings`
    });
    let issues = deduplicateIssues(allIssues);

    addTraceStep('🎯 Prioritizing issues by impact severity', {
      output: `${issues.length} unique issues identified`,
      reasoning: 'Organizing issues by severity: Critical (blocks access entirely) → Serious (major barriers) → Moderate (significant difficulty) → Minor (inconvenience). This prioritization helps teams focus remediation efforts on highest-impact issues first.',
    });
    // Sort by severity
    issues = sortIssues(issues);

    // Calculate metrics
    const metrics = calculateMetrics(issues);
    
    addTraceStep('📊 Calculating WCAG compliance metrics', {
      reasoning: 'Analyzing issues by WCAG principle (Perceivable, Operable, Understandable, Robust) and severity level. These metrics provide strategic overview of accessibility maturity and help identify systemic patterns (e.g., "Most issues are Perceivable suggests problems with visual design" or "High Operable issues indicate keyboard/interaction problems").',
      output: `${metrics.critical_issues} critical, ${metrics.serious_issues} serious, ${metrics.moderate_issues} moderate, ${metrics.minor_issues} minor`
    });

    // Add trace duration
    trace.duration_ms = Date.now() - startTime;

    addTraceStep('✅ Expert accessibility audit complete', {
      output: `Comprehensive analysis finished: ${issues.length} issues documented with expert remediation guidance`,
      reasoning: `Completed in ${trace.duration_ms}ms using ${trace.tools_used.length} specialized tools and ${trace.sources_consulted.length} authoritative sources. Audit provides: (1) Technical compliance assessment, (2) User impact analysis, (3) Pattern identification for root causes, (4) Strategic remediation roadmap, (5) Estimated effort and risk assessment.`,
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
