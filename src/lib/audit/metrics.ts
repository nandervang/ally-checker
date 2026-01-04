/**
 * Audit Metrics Calculator
 * 
 * Calculates aggregate metrics from issues:
 * - Total counts by severity (critical/serious/moderate/minor)
 * - Total counts by WCAG principle (perceivable/operable/understandable/robust)
 */

import type { Issue, AuditMetrics } from '@/types/audit';

/**
 * Calculate metrics from a list of issues
 */
export function calculateMetrics(issues: Issue[]): AuditMetrics {
  const metrics: AuditMetrics = {
    total_issues: issues.length,
    critical_issues: 0,
    serious_issues: 0,
    moderate_issues: 0,
    minor_issues: 0,
    perceivable_issues: 0,
    operable_issues: 0,
    understandable_issues: 0,
    robust_issues: 0,
  };

  for (const issue of issues) {
    // Count by severity
    switch (issue.severity) {
      case 'critical':
        metrics.critical_issues++;
        break;
      case 'serious':
        metrics.serious_issues++;
        break;
      case 'moderate':
        metrics.moderate_issues++;
        break;
      case 'minor':
        metrics.minor_issues++;
        break;
    }

    // Count by WCAG principle
    switch (issue.wcag_principle) {
      case 'perceivable':
        metrics.perceivable_issues++;
        break;
      case 'operable':
        metrics.operable_issues++;
        break;
      case 'understandable':
        metrics.understandable_issues++;
        break;
      case 'robust':
        metrics.robust_issues++;
        break;
    }
  }

  return metrics;
}

/**
 * Merge two sets of metrics
 */
export function mergeMetrics(a: AuditMetrics, b: AuditMetrics): AuditMetrics {
  return {
    total_issues: a.total_issues + b.total_issues,
    critical_issues: a.critical_issues + b.critical_issues,
    serious_issues: a.serious_issues + b.serious_issues,
    moderate_issues: a.moderate_issues + b.moderate_issues,
    minor_issues: a.minor_issues + b.minor_issues,
    perceivable_issues: a.perceivable_issues + b.perceivable_issues,
    operable_issues: a.operable_issues + b.operable_issues,
    understandable_issues: a.understandable_issues + b.understandable_issues,
    robust_issues: a.robust_issues + b.robust_issues,
  };
}
