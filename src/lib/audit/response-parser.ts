/**
 * Gemini Response Parser
 * 
 * Parses Gemini AI text output into structured Issue objects with WCAG mapping.
 * Handles multiple output formats and extracts:
 * - WCAG criteria (e.g., "1.1.1", "2.4.6")
 * - Severity levels (critical/serious/moderate/minor)
 * - Element selectors and HTML snippets
 * - Remediation guidance
 */

import type { Issue, IssueSeverity, WCAGLevel, WCAGPrinciple } from '@/types/audit';

// WCAG criterion to principle mapping
const WCAG_PRINCIPLE_MAP: Record<string, WCAGPrinciple> = {
  '1': 'perceivable',
  '2': 'operable',
  '3': 'understandable',
  '4': 'robust',
};

// WCAG criterion to level mapping (simplified - in production, use complete mapping)
const WCAG_LEVEL_MAP: Record<string, WCAGLevel> = {
  '1.1.1': 'A',
  '1.2.1': 'A',
  '1.3.1': 'A',
  '1.4.3': 'AA',
  '1.4.11': 'AA',
  '2.1.1': 'A',
  '2.4.1': 'A',
  '2.4.3': 'A',
  '2.4.6': 'AA',
  '2.5.5': 'AAA',
  '3.1.1': 'A',
  '3.2.3': 'AA',
  '3.3.2': 'A',
  '4.1.2': 'A',
  '4.1.3': 'AA',
};

interface ParsedIssue {
  criterion?: string;
  title?: string;
  description?: string;
  severity?: string;
  selector?: string;
  html?: string;
  fix?: string;
  code_example?: string;
}

/**
 * Extract WCAG criterion from text (e.g., "1.1.1", "WCAG 2.4.6")
 */
function extractWCAGCriterion(text: string): string | null {
  const patterns = [
    /\b(\d+\.\d+\.\d+)\b/g,  // Match "1.1.1"
    /WCAG\s+(\d+\.\d+\.\d+)/gi,  // Match "WCAG 1.1.1"
    /criterion\s+(\d+\.\d+\.\d+)/gi,  // Match "criterion 1.1.1"
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const criterion = match[0].replace(/WCAG\s+/gi, '').replace(/criterion\s+/gi, '').trim();
      if (/^\d+\.\d+\.\d+$/.test(criterion)) {
        return criterion;
      }
    }
  }

  return null;
}

/**
 * Extract severity level from text
 */
function extractSeverity(text: string): IssueSeverity {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('critical')) return 'critical';
  if (lowerText.includes('serious') || lowerText.includes('severe')) return 'serious';
  if (lowerText.includes('moderate')) return 'moderate';
  if (lowerText.includes('minor') || lowerText.includes('low')) return 'minor';
  
  // Default based on keywords
  if (lowerText.includes('must') || lowerText.includes('required')) return 'serious';
  if (lowerText.includes('should') || lowerText.includes('recommended')) return 'moderate';
  
  return 'moderate'; // Default
}

/**
 * Extract CSS selector from text
 */
function extractSelector(text: string): string | null {
  const patterns = [
    /selector:\s*([^\n]+)/i,
    /element:\s*([^\n]+)/i,
    /`([^`]+)`/,  // Backtick-quoted selector
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Extract HTML snippet from text
 */
function extractHTML(text: string): string | null {
  const patterns = [
    /```html\n([\s\S]+?)\n```/,
    /<([a-z]+[^>]*)>/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const html = match[1] || match[0];
      return html.trim().substring(0, 200); // Limit to 200 chars
    }
  }

  return null;
}

/**
 * Extract code example from text
 */
function extractCodeExample(text: string): string | null {
  const match = text.match(/```(?:html|jsx|tsx)?\n([\s\S]+?)\n```/);
  return match ? match[1].trim() : null;
}

/**
 * Parse structured JSON format if Gemini returns JSON
 */
function parseJSONResponse(text: string): Issue[] {
  try {
    const jsonMatch = text.match(/```json\n([\s\S]+?)\n```/) || text.match(/\{[\s\S]+\}/);
    if (!jsonMatch) return [];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const issues = Array.isArray(data) ? data : data.issues || [];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return issues.map((issue: any) => {
      const criterion = issue.wcag_criterion || issue.criterion || 'Unknown';
      const principleNum = criterion.split('.')[0];
      
      // Get description - ensure it's a string and not the whole JSON
      let description = issue.description || issue.message || issue.problem || '';
      if (typeof description === 'object') {
        description = issue.title || 'Accessibility Issue';
      }
      
      // Ensure description is reasonable length (not the whole response)
      if (description.length > 500 && description.includes('{')) {
        description = issue.title || 'Accessibility Issue';
      }
      
      return {
        wcag_criterion: criterion,
        wcag_level: issue.wcag_level || WCAG_LEVEL_MAP[criterion] || 'AA',
        wcag_principle: WCAG_PRINCIPLE_MAP[principleNum] || 'perceivable',
        title: issue.title || issue.name || 'Accessibility Issue',
        description: description.trim(),
        severity: (issue.severity?.toLowerCase() || 'moderate') as IssueSeverity,
        source: issue.source || 'ai-heuristic',
        confidence_score: issue.confidence || issue.confidence_score,
        element_selector: issue.selector || issue.element_selector,
        element_html: issue.html || issue.element_html,
        element_context: issue.context || issue.element_context,
        how_to_fix: issue.fix || issue.how_to_fix || issue.remediation || '',
        code_example: issue.code_example || issue.example,
        wcag_url: issue.url || issue.wcag_url || `https://www.w3.org/WAI/WCAG22/Understanding/${criterion.replace(/\./g, '')}.html`,
        user_impact: issue.user_impact || issue.impact,
        expert_analysis: issue.expert_analysis || issue.analysis,
        testing_instructions: issue.testing_instructions || issue.test_instructions,
        // Magenta A11y-style testing fields
        how_to_reproduce: issue.how_to_reproduce,
        keyboard_testing: issue.keyboard_testing,
        screen_reader_testing: issue.screen_reader_testing,
        visual_testing: issue.visual_testing,
        expected_behavior: issue.expected_behavior,
        report_text: issue.report_text,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Parse markdown-style sections (## Issue 1, ### Criterion, etc.)
 */
function parseMarkdownSections(text: string): Issue[] {
  const issues: Issue[] = [];
  // Match both ## and #### headings for issues
  const sections = text.split(/(?=^#{2,4}\s+(?:Issue|Violation|Problem))/gim);

  for (const section of sections) {
    if (!section.trim()) continue;

    const parsedIssue: ParsedIssue = {};

    // Extract criterion
    parsedIssue.criterion = extractWCAGCriterion(section);

    // Extract title - match both ## and ####
    const titleMatch = section.match(/^#{2,4}\s+(.+)$/m);
    parsedIssue.title = titleMatch ? titleMatch[1].trim() : undefined;

    // Extract description
    const descMatch = section.match(/(?:Description|Issue|Problem):\s*([^\n]+(?:\n(?!#+)[^\n]+)*)/i);
    parsedIssue.description = descMatch ? descMatch[1].trim() : section.substring(0, 200);

    // Extract severity
    parsedIssue.severity = extractSeverity(section);

    // Extract selector and HTML
    parsedIssue.selector = extractSelector(section);
    parsedIssue.html = extractHTML(section);

    // Extract fix
    const fixMatch = section.match(/(?:Fix|Solution|Remediation|How to fix):\s*([^\n]+(?:\n(?!#+)[^\n]+)*)/i);
    parsedIssue.fix = fixMatch ? fixMatch[1].trim() : undefined;

    // Extract code example
    parsedIssue.code_example = extractCodeExample(section);

    // Only add if we have at least a criterion or title
    if (parsedIssue.criterion || parsedIssue.title) {
      const criterion = parsedIssue.criterion || 'Unknown';
      const principleNum = criterion.split('.')[0];

      issues.push({
        wcag_criterion: criterion,
        wcag_level: WCAG_LEVEL_MAP[criterion] || 'AA',
        wcag_principle: (WCAG_PRINCIPLE_MAP[principleNum] || 'perceivable') as WCAGPrinciple,
        title: parsedIssue.title || `Issue with ${criterion}`,
        description: parsedIssue.description || '',
        severity: (parsedIssue.severity as IssueSeverity) || 'moderate',
        source: 'ai-heuristic',
        element_selector: parsedIssue.selector,
        element_html: parsedIssue.html,
        how_to_fix: parsedIssue.fix || 'Review WCAG guidelines for remediation steps.',
        code_example: parsedIssue.code_example,
        wcag_url: `https://www.w3.org/WAI/WCAG22/Understanding/${criterion.replace(/\./g, '')}`,
        user_impact: undefined, // Will be generated by AI or default based on severity
      });
    }
  }

  return issues;
}

/**
 * Parse plain text with simple bullet points or numbered lists
 */
function parseSimpleList(text: string): Issue[] {
  const issues: Issue[] = [];
  const lines = text.split('\n');
  let currentIssue: Partial<Issue> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // New issue starts with bullet or number
    if (/^[-*•]\s+|\d+\.\s+/.test(trimmed)) {
      if (currentIssue && currentIssue.title) {
        const criterion = currentIssue.wcag_criterion || 'Unknown';
        const principleNum = criterion.split('.')[0];
        
        issues.push({
          wcag_criterion: criterion,
          wcag_level: currentIssue.wcag_level || 'AA',
          wcag_principle: (WCAG_PRINCIPLE_MAP[principleNum] || 'perceivable') as WCAGPrinciple,
          title: currentIssue.title,
          description: currentIssue.description || '',
          severity: currentIssue.severity || 'moderate',
          source: 'ai-heuristic',
          how_to_fix: currentIssue.how_to_fix || '',
        } as Issue);
      }

      const criterion = extractWCAGCriterion(trimmed);
      currentIssue = {
        wcag_criterion: criterion || undefined,
        title: trimmed.replace(/^[-*•]\s+|\d+\.\s+/, '').trim(),
        severity: extractSeverity(trimmed),
      };
    } else if (currentIssue && trimmed) {
      // Accumulate description
      currentIssue.description = (currentIssue.description || '') + ' ' + trimmed;
      
      // Check for fix instructions
      if (/fix:|solution:|remediation:/i.test(trimmed)) {
        currentIssue.how_to_fix = trimmed.replace(/fix:|solution:|remediation:/i, '').trim();
      }
    }
  }

  // Add last issue
  if (currentIssue && currentIssue.title) {
    const criterion = currentIssue.wcag_criterion || 'Unknown';
    const principleNum = criterion.split('.')[0];
    
    issues.push({
      wcag_criterion: criterion,
      wcag_level: currentIssue.wcag_level || 'AA',
      wcag_principle: (WCAG_PRINCIPLE_MAP[principleNum] || 'perceivable') as WCAGPrinciple,
      title: currentIssue.title,
      description: currentIssue.description || '',
      severity: currentIssue.severity || 'moderate',
      source: 'ai-heuristic',
      how_to_fix: currentIssue.how_to_fix || '',
    } as Issue);
  }

  return issues;
}

/**
 * Main parser: Try multiple strategies to extract issues from Gemini response
 */
export function parseGeminiResponse(text: string): Issue[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Strategy 1: Try JSON format
  const jsonIssues = parseJSONResponse(text);
  if (jsonIssues.length > 0) {
    return jsonIssues;
  }

  // Strategy 2: Try markdown sections
  const markdownIssues = parseMarkdownSections(text);
  if (markdownIssues.length > 0) {
    return markdownIssues;
  }

  // Strategy 3: Try simple list
  const listIssues = parseSimpleList(text);
  if (listIssues.length > 0) {
    return listIssues;
  }

  // Fallback: Create a single generic issue
  return [{
    wcag_criterion: 'Unknown',
    wcag_level: 'AA',
    wcag_principle: 'perceivable',
    title: 'Accessibility Analysis',
    description: text.substring(0, 500),
    severity: 'moderate',
    source: 'ai-heuristic',
    how_to_fix: 'Review the analysis and apply recommended fixes.',
  }];
}
