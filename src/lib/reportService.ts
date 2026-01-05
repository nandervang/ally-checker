import type { AuditResult } from '@/data/mockAuditResults';

interface CustomReportRequest {
  auditId: string;
  selectedIssueIds: string[];
  format: 'word' | 'html' | 'markdown' | 'text';
  locale: string;
}

export async function generateCustomReport(
  request: CustomReportRequest,
  allIssues: AuditResult['issues']
): Promise<Blob> {
  // Filter issues to only selected ones
  const selectedIssues = allIssues.filter(issue => 
    request.selectedIssueIds.includes(issue.id)
  );

  // TODO: Call the actual report generation service (netlify/functions/generate-report)
  // For now, return a mock blob
  console.log('Generating custom report with', selectedIssues.length, 'issues');
  
  // This would call the Python reporting service
  // const response = await fetch('/.netlify/functions/generate-report', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     audit_id: request.auditId,
  //     template: 'etu-standard',
  //     format: request.format,
  //     locale: request.locale,
  //     audit_data: {
  //       // Map to report service format
  //       issues: selectedIssues.map(mapToReportIssue),
  //     }
  //   })
  // });
  
  return new Blob(['Custom report placeholder'], { type: 'application/octet-stream' });
}

export async function downloadCustomReport(
  blob: Blob,
  filename: string,
  format: 'word' | 'html' | 'markdown' | 'text'
): Promise<void> {
  const extensions = {
    word: 'docx',
    html: 'html',
    markdown: 'md',
    text: 'txt',
  };

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${extensions[format]}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadReport(
  auditData: AuditResult,
  format: 'word' | 'html' | 'markdown' | 'text'
): Promise<void> {
  // Full report download
  const blob = await generateCustomReport(
    {
      auditId: auditData.auditId || 'unknown',
      selectedIssueIds: auditData.issues.map(i => i.id),
      format,
      locale: 'sv-SE',
    },
    auditData.issues
  );

  const today = new Date().toISOString().split('T')[0];
  await downloadCustomReport(blob, `audit-report-${today ?? 'unknown'}`, format);
}
