/**
 * Accessibility Statement Generator
 * 
 * Generates compliant accessibility statements based on selected audit issues.
 * Follows WCAG 2.2 and EU Web Accessibility Directive requirements.
 */

import type { AuditIssue } from '@/data/mockAuditResults';

export interface AccessibilityStatementData {
  organizationName: string;
  websiteUrl: string;
  contactEmail: string;
  statementDate: string;
  auditDate: string;
  conformanceLevel: 'A' | 'AA' | 'AAA' | 'Partial' | 'Non-conformant';
  knownIssues: AuditIssue[];
  methodology: string[];
  technicalSpecs: string[];
}

export interface GeneratedStatement {
  html: string;
  plainText: string;
  markdown: string;
}

/**
 * Group issues by WCAG principle for better organization
 */
function groupIssuesByPrinciple(issues: AuditIssue[]) {
  return issues.reduce<Record<string, AuditIssue[]>>((acc, issue) => {
    if (!acc[issue.principle]) {
      acc[issue.principle] = [];
    }
    acc[issue.principle]?.push(issue);
    return acc;
  }, {});
}

/**
 * Determine conformance level based on issues
 */
function determineConformanceLevel(issues: AuditIssue[]): string {
  const hasLevelA = issues.some(i => i.wcagLevel === 'A');
  const hasLevelAA = issues.some(i => i.wcagLevel === 'AA');
  const hasLevelAAA = issues.some(i => i.wcagLevel === 'AAA');
  
  if (hasLevelA) {
    return 'Non-conformant (Level A issues present)';
  }
  if (hasLevelAA) {
    return 'Partially conformant to WCAG 2.2 Level AA';
  }
  if (hasLevelAAA) {
    return 'Conformant to WCAG 2.2 Level AA, partially conformant to Level AAA';
  }
  return 'Fully conformant to WCAG 2.2 Level AA';
}

/**
 * Generate accessibility statement in multiple formats
 */
export function generateAccessibilityStatement(data: AccessibilityStatementData): GeneratedStatement {
  const {
    organizationName,
    websiteUrl,
    contactEmail,
    statementDate,
    auditDate,
    knownIssues,
    methodology = ['Automated testing with axe-core', 'AI-powered heuristic analysis', 'Manual review'],
    technicalSpecs = ['HTML5', 'CSS3', 'JavaScript', 'WAI-ARIA'],
  } = data;

  const conformanceLevel = determineConformanceLevel(knownIssues);
  const issuesByPrinciple = groupIssuesByPrinciple(knownIssues);
  const principleNames = {
    perceivable: 'Perceivable',
    operable: 'Operable',
    understandable: 'Understandable',
    robust: 'Robust',
  };

  // Generate HTML
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Statement - ${organizationName}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
    h2 { color: #1e40af; margin-top: 30px; }
    h3 { color: #1e3a8a; }
    .meta { color: #6b7280; font-size: 0.9em; margin: 20px 0; }
    .issue { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
    .issue-title { font-weight: bold; color: #92400e; }
    .issue-details { margin-top: 8px; font-size: 0.9em; }
    .conformance { background: #e0e7ff; border: 2px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .contact { background: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 8px; }
    ul { margin: 10px 0; }
    li { margin: 5px 0; }
  </style>
</head>
<body>
  <h1>Accessibility Statement for ${organizationName}</h1>
  
  <div class="meta">
    <p><strong>Website:</strong> <a href="${websiteUrl}">${websiteUrl}</a></p>
    <p><strong>Statement updated:</strong> ${statementDate}</p>
    <p><strong>Last audited:</strong> ${auditDate}</p>
  </div>

  <h2>Commitment to Accessibility</h2>
  <p>
    ${organizationName} is committed to ensuring digital accessibility for people with disabilities. 
    We are continually improving the user experience for everyone and applying the relevant accessibility standards.
  </p>

  <div class="conformance">
    <h2>Conformance Status</h2>
    <p><strong>${conformanceLevel}</strong></p>
    <p>
      This assessment is based on a comprehensive audit conducted on ${auditDate}, 
      evaluating compliance with the Web Content Accessibility Guidelines (WCAG) 2.2.
    </p>
  </div>

  <h2>Known Accessibility Issues (${String(knownIssues.length)})</h2>
  <p>
    We have identified ${String(knownIssues.length)} accessibility issue${knownIssues.length !== 1 ? 's' : ''} that we are actively working to resolve. 
    These issues are organized by WCAG 2.2 principles:
  </p>

  ${Object.entries(issuesByPrinciple).map(([principle, issues]) => `
    <h3>${principleNames[principle as keyof typeof principleNames]} (${String(issues.length)} issue${issues.length !== 1 ? 's' : ''})</h3>
    ${issues.map(issue => `
      <div class="issue">
        <div class="issue-title">${issue.title}</div>
        <div class="issue-details">
          <strong>WCAG Criterion:</strong> ${issue.guideline} (Level ${issue.wcagLevel})<br>
          <strong>Severity:</strong> ${issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}<br>
          <strong>Description:</strong> ${issue.description}<br>
          <strong>Planned remediation:</strong> ${issue.remediation}
        </div>
      </div>
    `).join('')}
  `).join('')}

  <h2>Assessment Methodology</h2>
  <p>This accessibility statement was created based on the following evaluation methods:</p>
  <ul>
    ${methodology.map(method => `<li>${method}</li>`).join('')}
  </ul>

  <h2>Technical Specifications</h2>
  <p>Accessibility of this website relies on the following technologies:</p>
  <ul>
    ${technicalSpecs.map(spec => `<li>${spec}</li>`).join('')}
  </ul>

  <div class="contact">
    <h2>Feedback and Contact Information</h2>
    <p>
      We welcome your feedback on the accessibility of ${organizationName}. 
      Please contact us if you encounter accessibility barriers:
    </p>
    <p><strong>Email:</strong> <a href="mailto:${contactEmail}">${contactEmail}</a></p>
    <p>We aim to respond to accessibility feedback within 5 business days.</p>
  </div>

  <h2>Enforcement and Complaints</h2>
  <p>
    If you are not satisfied with our response, you have the right to lodge a complaint 
    with your national enforcement body responsible for accessibility legislation.
  </p>

  <hr style="margin: 40px 0; border: none; border-top: 1px solid #e5e7eb;">
  
  <p style="font-size: 0.8em; color: #6b7280;">
    This statement was generated on ${statementDate} using the Ally Checker accessibility audit tool.
  </p>
</body>
</html>
  `.trim();

  // Generate Markdown
  const markdown = `
# Accessibility Statement for ${organizationName}

**Website:** ${websiteUrl}  
**Statement updated:** ${statementDate}  
**Last audited:** ${auditDate}

## Commitment to Accessibility

${organizationName} is committed to ensuring digital accessibility for people with disabilities. 
We are continually improving the user experience for everyone and applying the relevant accessibility standards.

## Conformance Status

**${conformanceLevel}**

This assessment is based on a comprehensive audit conducted on ${auditDate}, 
evaluating compliance with the Web Content Accessibility Guidelines (WCAG) 2.2.

## Known Accessibility Issues (${String(knownIssues.length)})

We have identified ${String(knownIssues.length)} accessibility issue${knownIssues.length !== 1 ? 's' : ''} that we are actively working to resolve:

${Object.entries(issuesByPrinciple).map(([principle, issues]) => `
### ${principleNames[principle as keyof typeof principleNames]} (${String(issues.length)} issue${issues.length !== 1 ? 's' : ''})

${issues.map(issue => `
**${issue.title}**  
- **WCAG Criterion:** ${issue.guideline} (Level ${issue.wcagLevel})
- **Severity:** ${issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
- **Description:** ${issue.description}
- **Planned remediation:** ${issue.remediation}
`).join('\n')}
`).join('\n')}

## Assessment Methodology

This accessibility statement was created based on the following evaluation methods:

${methodology.map(method => `- ${method}`).join('\n')}

## Technical Specifications

Accessibility of this website relies on the following technologies:

${technicalSpecs.map(spec => `- ${spec}`).join('\n')}

## Feedback and Contact Information

We welcome your feedback on the accessibility of ${organizationName}. 
Please contact us if you encounter accessibility barriers:

**Email:** ${contactEmail}

We aim to respond to accessibility feedback within 5 business days.

## Enforcement and Complaints

If you are not satisfied with our response, you have the right to lodge a complaint 
with your national enforcement body responsible for accessibility legislation.

---

*This statement was generated on ${statementDate} using the Ally Checker accessibility audit tool.*
  `.trim();

  // Generate Plain Text
  const plainText = `
ACCESSIBILITY STATEMENT FOR ${organizationName.toUpperCase()}

Website: ${websiteUrl}
Statement updated: ${statementDate}
Last audited: ${auditDate}

COMMITMENT TO ACCESSIBILITY

${organizationName} is committed to ensuring digital accessibility for people with disabilities. 
We are continually improving the user experience for everyone and applying the relevant accessibility standards.

CONFORMANCE STATUS

${conformanceLevel}

This assessment is based on a comprehensive audit conducted on ${auditDate}, 
evaluating compliance with the Web Content Accessibility Guidelines (WCAG) 2.2.

KNOWN ACCESSIBILITY ISSUES (${String(knownIssues.length)})

We have identified ${String(knownIssues.length)} accessibility issue${knownIssues.length !== 1 ? 's' : ''} that we are actively working to resolve:

${Object.entries(issuesByPrinciple).map(([principle, issues]) => `
${principleNames[principle as keyof typeof principleNames].toUpperCase()} (${String(issues.length)} issue${issues.length !== 1 ? 's' : ''})

${issues.map((issue, idx) => `
${String(idx + 1)}. ${issue.title}
   WCAG Criterion: ${issue.guideline} (Level ${issue.wcagLevel})
   Severity: ${issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
   Description: ${issue.description}
   Planned remediation: ${issue.remediation}
`).join('\n')}
`).join('\n')}

ASSESSMENT METHODOLOGY

This accessibility statement was created based on the following evaluation methods:
${methodology.map((method, idx) => `${String(idx + 1)}. ${method}`).join('\n')}

TECHNICAL SPECIFICATIONS

Accessibility of this website relies on the following technologies:
${technicalSpecs.map((spec, idx) => `${String(idx + 1)}. ${spec}`).join('\n')}

FEEDBACK AND CONTACT INFORMATION

We welcome your feedback on the accessibility of ${organizationName}. 
Please contact us if you encounter accessibility barriers:

Email: ${contactEmail}

We aim to respond to accessibility feedback within 5 business days.

ENFORCEMENT AND COMPLAINTS

If you are not satisfied with our response, you have the right to lodge a complaint 
with your national enforcement body responsible for accessibility legislation.

---
This statement was generated on ${statementDate} using the Ally Checker accessibility audit tool.
  `.trim();

  return {
    html,
    plainText,
    markdown,
  };
}

/**
 * Download generated statement file
 */
export function downloadStatement(content: string, filename: string, format: 'html' | 'txt' | 'md') {
  const mimeTypes = {
    html: 'text/html',
    txt: 'text/plain',
    md: 'text/markdown',
  };

  const blob = new Blob([content], { type: mimeTypes[format] });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}
