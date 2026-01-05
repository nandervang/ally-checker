/**
 * Custom Report Service
 * Generates reports from selected issues subset
 */

import type { AuditIssue } from '@/data/mockAuditResults';

export interface CustomReportRequest {
  auditId: string;
  selectedIssueIds: string[];
  format: 'word' | 'html' | 'markdown' | 'text';
  template?: string;
  locale?: string;
}

export interface CustomReportMetadata {
  reportType: 'custom';
  totalAuditIssues: number;
  selectedIssues: number;
  selectionCriteria: 'User selection';
  generatedAt: string;
}

/**
 * Generate a custom report from selected issues
 */
export async function generateCustomReport(
  request: CustomReportRequest,
  allIssues: AuditIssue[]
): Promise<Blob> {
  // Filter to only selected issues
  const selectedIssues = allIssues.filter(issue => 
    request.selectedIssueIds.includes(issue.id)
  );

  // Build request payload for report service
  const reportPayload = {
    audit_id: request.auditId,
    format: request.format,
    template: request.template || 'etu-standard',
    locale: request.locale || 'sv-SE',
    audit_data: {
      url: 'Custom Report',
      input_type: 'issue_only' as const,
      created_at: new Date().toISOString(),
      total_issues: selectedIssues.length,
      perceivable_count: selectedIssues.filter(i => i.principle === 'perceivable').length,
      operable_count: selectedIssues.filter(i => i.principle === 'operable').length,
      understandable_count: selectedIssues.filter(i => i.principle === 'understandable').length,
      robust_count: selectedIssues.filter(i => i.principle === 'robust').length,
      issues: selectedIssues.map(issue => ({
        wcag_principle: issue.principle.charAt(0).toUpperCase() + issue.principle.slice(1) as 'Perceivable' | 'Operable' | 'Understandable' | 'Robust',
        success_criterion: extractSuccessCriterion(issue.guideline),
        success_criterion_name: issue.guideline,
        severity: issue.severity,
        description: issue.description,
        element_snippet: issue.element || undefined,
        detection_source: 'axe-core' as const,
        remediation: issue.remediation,
        wcag_reference_url: issue.helpUrl || undefined,
      })),
    },
    metadata: {
      report_type: 'custom',
      total_audit_issues: allIssues.length,
      selected_issues: selectedIssues.length,
      selection_criteria: 'User selection',
      generated_at: new Date().toISOString(),
    } as CustomReportMetadata,
  };

  // Call report generation endpoint
  // In development, use a mock implementation
  if (import.meta.env.DEV) {
    // Development mock: generate a simple text report
    console.log('Development mode: Generating mock custom report', reportPayload);
    
    const reportText = generateMockReport(selectedIssues, allIssues.length);
    const blob = new Blob([reportText], { type: getMimeType(request.format) });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return blob;
  }
  
  // Production: call Netlify function
  const response = await fetch('/.netlify/functions/generate-report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reportPayload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Report generation failed: ${error}`);
  }

  // Return blob for download
  return await response.blob();
}

/**
 * Download custom report
 */
export async function downloadCustomReport(
  blob: Blob,
  filename: string,
  format: string
): Promise<void> {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  const extension = format === 'word' ? 'docx' : format;
  link.download = `${filename}.${extension}`;
  
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Extract success criterion from guideline string
 * Example: "1.1.1 Non-text Content (Level A)" -> "1.1.1"
 */
function extractSuccessCriterion(guideline: string): string {
  const match = guideline.match(/^(\d+\.\d+\.\d+)/);
  return match ? match[1] : '1.1.1'; // Fallback
}

/**
 * Get MIME type for format
 */
function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    'word': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'html': 'text/html',
    'markdown': 'text/markdown',
    'text': 'text/plain',
  };
  return mimeTypes[format] || 'text/plain';
}

/**
 * Generate a mock report for development
 */
function generateMockReport(selectedIssues: AuditIssue[], totalIssues: number): string {
  const timestamp = new Date().toLocaleString();
  
  let report = `CUSTOM ACCESSIBILITY REPORT
=================================

Generated: ${timestamp}
Selected Issues: ${selectedIssues.length} of ${totalIssues} total

ISSUES BY SEVERITY
------------------

`;

  // Group by severity
  const bySeverity = selectedIssues.reduce((acc, issue) => {
    if (!acc[issue.severity]) acc[issue.severity] = [];
    acc[issue.severity].push(issue);
    return acc;
  }, {} as Record<string, AuditIssue[]>);

  for (const [severity, issues] of Object.entries(bySeverity)) {
    report += `\n${severity.toUpperCase()} (${issues.length} issues)\n`;
    report += '-'.repeat(50) + '\n\n';
    
    issues.forEach((issue, idx) => {
      report += `${idx + 1}. ${issue.title}\n`;
      report += `   WCAG: ${issue.guideline} (${issue.wcagLevel})\n`;
      report += `   Principle: ${issue.principle}\n`;
      report += `   Description: ${issue.description}\n`;
      report += `   Remediation: ${issue.remediation}\n`;
      if (issue.element) {
        report += `   Element: ${issue.element}\n`;
      }
      report += `\n`;
    });
  }

  report += `\n\nNOTE: This is a development mock report.
In production, this will be generated by the Python reporting agent with proper formatting.\n`;

  return report;
}
