/**
 * Issue Deduplication
 * 
 * Merges duplicate issues from multiple sources (axe-core + AI heuristics).
 * Deduplication strategy:
 * - Same WCAG criterion + similar element → merge
 * - Keep highest severity
 * - Combine descriptions
 * - Track all sources
 */

import type { Issue } from '@/types/audit';

interface IssueKey {
  criterion: string;
  selector: string;
  title: string;
}

/**
 * Generate a unique key for an issue
 */
function getIssueKey(issue: Issue): string {
  const criterion = issue.wcag_criterion || 'unknown';
  const selector = (issue.element_selector || '').toLowerCase().trim();
  const title = issue.title.toLowerCase().trim().substring(0, 50);
  
  return `${criterion}|${selector}|${title}`;
}

/**
 * Calculate similarity between two strings (0-1)
 */
function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;
  
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  
  if (longer.length === 0) return 1;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Check if two issues are duplicates
 */
function isDuplicate(a: Issue, b: Issue): boolean {
  // Same WCAG criterion is required
  if (a.wcag_criterion !== b.wcag_criterion) {
    return false;
  }

  // If both have selectors, they must match
  if (a.element_selector && b.element_selector) {
    if (a.element_selector === b.element_selector) {
      return true;
    }
  }

  // Check title similarity
  const titleSimilarity = similarity(
    a.title.toLowerCase(),
    b.title.toLowerCase()
  );

  if (titleSimilarity > 0.8) {
    return true;
  }

  // Check description similarity
  const descSimilarity = similarity(
    a.description.toLowerCase(),
    b.description.toLowerCase()
  );

  if (descSimilarity > 0.7) {
    return true;
  }

  return false;
}

/**
 * Merge two duplicate issues
 */
function mergeIssues(primary: Issue, secondary: Issue): Issue {
  // Use higher severity
  const severityOrder = { critical: 4, serious: 3, moderate: 2, minor: 1 };
  const severity = severityOrder[primary.severity] >= severityOrder[secondary.severity]
    ? primary.severity
    : secondary.severity;

  // Combine sources
  const sources = new Set([primary.source, secondary.source]);
  const source = sources.has('axe-core') ? 'axe-core' : primary.source;

  // Prefer more detailed description
  const description = primary.description.length >= secondary.description.length
    ? primary.description
    : secondary.description;

  // Prefer non-empty values
  const merged: Issue = {
    ...primary,
    severity,
    source,
    description,
    element_selector: primary.element_selector || secondary.element_selector,
    element_html: primary.element_html || secondary.element_html,
    element_context: primary.element_context || secondary.element_context,
    how_to_fix: primary.how_to_fix || secondary.how_to_fix,
    code_example: primary.code_example || secondary.code_example,
    wcag_url: primary.wcag_url || secondary.wcag_url,
    confidence_score: Math.max(
      primary.confidence_score || 0,
      secondary.confidence_score || 0
    ) || undefined,
  };

  return merged;
}

/**
 * Deduplicate a list of issues
 */
export function deduplicateIssues(issues: Issue[]): Issue[] {
  if (issues.length === 0) return [];

  const deduplicated: Issue[] = [];
  const processed = new Set<number>();

  for (let i = 0; i < issues.length; i++) {
    if (processed.has(i)) continue;

    let current = issues[i];

    // Find all duplicates
    for (let j = i + 1; j < issues.length; j++) {
      if (processed.has(j)) continue;

      if (isDuplicate(current, issues[j])) {
        current = mergeIssues(current, issues[j]);
        processed.add(j);
      }
    }

    deduplicated.push(current);
    processed.add(i);
  }

  return deduplicated;
}

/**
 * Sort issues by severity (critical first) and WCAG criterion
 */
export function sortIssues(issues: Issue[]): Issue[] {
  const severityOrder = { critical: 4, serious: 3, moderate: 2, minor: 1 };

  return [...issues].sort((a, b) => {
    // Sort by severity first
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;

    // Then by WCAG criterion
    return a.wcag_criterion.localeCompare(b.wcag_criterion);
  });
}
