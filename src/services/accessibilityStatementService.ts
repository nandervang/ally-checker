/**
 * Accessibility Statement Generator
 * 
 * Generates compliant accessibility statements based on selected audit issues.
 * Follows:
 * - WCAG 2.2 Level AA requirements
 * - EU Web Accessibility Directive (2016/2102)
 * - Swedish Law (2018:1937) on accessibility of digital public services (DIGG)
 * - W3C WAI statement template structure
 */

import type { AuditIssue } from '@/data/mockAuditResults';

export interface AccessibilityStatementData {
  organizationName: string;
  websiteUrl: string;
  contactEmail: string;
  contactPhone?: string;
  conformanceStatus?: 'Full' | 'Partial' | 'Non-conformant';
  knownLimitations?: string;
  statementDate: string;
  auditDate: string;
  conformanceLevel: 'A' | 'AA' | 'AAA' | 'Partial' | 'Non-conformant';
  knownIssues: AuditIssue[];
  methodology?: string[];
  technicalSpecs?: string[];
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
    contactPhone,
    conformanceStatus,
    knownLimitations,
    statementDate,
    auditDate,
    knownIssues,
    methodology = ['Automated testing with axe-core', 'AI-powered heuristic analysis', 'Manual review'],
    technicalSpecs = ['HTML5', 'CSS3', 'JavaScript', 'WAI-ARIA'],
  } = data;

  const conformanceLevel = conformanceStatus || determineConformanceLevel(knownIssues);
  const issuesByPrinciple = groupIssuesByPrinciple(knownIssues);
  const principleNames = {
    perceivable: 'Perceivable',
    operable: 'Operable',
    understandable: 'Understandable',
    robust: 'Robust',
  };

  // Generate HTML (W3C WAI + DIGG compliant structure)
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
    .digg-notice { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    ul { margin: 10px 0; }
    li { margin: 5px 0; }
  </style>
</head>
<body>
  <main>
    <h1>Accessibility Statement for ${organizationName}</h1>
    
    <div class=\"meta\">
      <p><strong>Website:</strong> <a href=\"${websiteUrl}\">${websiteUrl}</a></p>
      <p><strong>Statement updated:</strong> ${statementDate}</p>
      <p><strong>Last audited:</strong> ${auditDate}</p>
    </div>

    <section>
      <h2>Commitment to Accessibility</h2>
      <p>
        ${organizationName} is committed to ensuring digital accessibility for people with disabilities. 
        We are continually improving the user experience for everyone and applying the relevant accessibility standards.
      </p>
      <p>
        This statement complies with:
      </p>
      <ul>
        <li><strong>WCAG 2.2 Level AA</strong> - Web Content Accessibility Guidelines</li>
        <li><strong>EU Directive 2016/2102</strong> - Accessibility of websites and mobile applications</li>
        <li><strong>Swedish Law 2018:1937</strong> - Accessibility of digital public services (DIGG)</li>
      </ul>
    </section>

    <div class=\"conformance\">
      <h2>Conformance Status</h2>
      <p><strong>${typeof conformanceLevel === 'string' && conformanceLevel.includes('Partial') ? 'Partially Conformant' : typeof conformanceLevel === 'string' && conformanceLevel.includes('Non') ? 'Non-conformant' : 'Conformant'}</strong> with WCAG 2.2 Level AA</p>
      <p>
        This assessment is based on a comprehensive audit conducted on ${auditDate}, 
        evaluating compliance with the Web Content Accessibility Guidelines (WCAG) 2.2.
      </p>
    </div>

    <section>
      <h2>Known Accessibility Issues (${String(knownIssues.length)})</h2>
      <p>
        We have identified ${String(knownIssues.length)} accessibility issue${knownIssues.length !== 1 ? 's' : ''} that we are actively working to resolve. 
        These issues are organized by WCAG 2.2 principles:
      </p>

      ${Object.entries(issuesByPrinciple).map(([principle, issues]) => `
        <h3>${principleNames[principle as keyof typeof principleNames]} (${String(issues.length)} issue${issues.length !== 1 ? 's' : ''})</h3>
        ${issues.map(issue => `
          <div class=\"issue\" role=\"article\">
            <div class=\"issue-title\">${issue.title}</div>
            <div class=\"issue-details\">
              <strong>WCAG Criterion:</strong> ${issue.guideline} (Level ${issue.wcagLevel})<br>
              <strong>Severity:</strong> ${issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}<br>
              <strong>Description:</strong> ${issue.description}<br>
              <strong>Planned remediation:</strong> ${issue.remediation}
            </div>
          </div>
        `).join('')}
      `).join('')}
    </section>

    ${knownLimitations ? `
    <section>
      <h2>Known Limitations</h2>
      <div class=\"digg-notice\">
        <p>${knownLimitations}</p>
      </div>
    </section>
    ` : ''}

    <section>
      <h2>Alternative Access</h2>
      <p>If you encounter content that is not accessible, you may request it in an alternative format:</p>
      <ul>
        <li>Contact us using the details below to request alternative formats</li>
        <li>We will provide the content in an accessible format within a reasonable time frame</li>
        <li>Alternative formats include: Plain text, large print, audio, or other formats upon request</li>
      </ul>
    </section>

    <section>
      <h2>Assessment Methodology</h2>
      <p>This accessibility statement was created based on the following evaluation methods:</p>
      <ul>
        ${methodology.map(method => `<li>${method}</li>`).join('')}
      </ul>
    </section>

    <section>
      <h2>Technical Specifications</h2>
      <p>Accessibility of this website relies on the following technologies:</p>
      <ul>
        ${technicalSpecs.map(spec => `<li>${spec}</li>`).join('')}
      </ul>
      <p>These technologies are relied upon for conformance with the accessibility standards used.</p>
    </section>

    <div class=\"contact\">
      <h2>Feedback and Contact Information</h2>
      <p>
        We welcome your feedback on the accessibility of ${organizationName}. 
        Please contact us if you encounter accessibility barriers:
      </p>
      <ul>
        <li><strong>Email:</strong> <a href=\"mailto:${contactEmail}\">${contactEmail}</a></li>
        ${contactPhone ? `<li><strong>Phone:</strong> ${contactPhone}</li>` : ''}
      </ul>
      <p><strong>Response time:</strong> We aim to respond to accessibility feedback within 5 business days.</p>
    </div>

    <section>
      <h2>Enforcement and Complaints (DIGG)</h2>
      <p>
        If you are not satisfied with our response, you have the right to lodge a complaint.
      </p>
      <p>
        <strong>For Swedish public sector organizations:</strong> Contact the Swedish Agency for Digital Government (DIGG):
      </p>
      <ul>
        <li>Website: <a href=\"https://www.digg.se/\">https://www.digg.se/</a></li>
        <li>Information about complaints: <a href=\"https://www.digg.se/tdosanmalan\">https://www.digg.se/tdosanmalan</a></li>
      </ul>
      <p>
        <strong>For other EU countries:</strong> Contact your national enforcement body responsible for accessibility legislation.
      </p>
    </section>

    <hr style=\"margin: 40px 0; border: none; border-top: 1px solid #e5e7eb;\">
    
    <footer>
      <p style=\"font-size: 0.8em; color: #6b7280;\">
        This statement was generated on ${statementDate} using the Ally Checker accessibility audit tool.
        Statement prepared in accordance with WCAG 2.2 Level AA, EU Directive 2016/2102, and Swedish Law 2018:1937 (DIGG).
      </p>
    </footer>
  </main>
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

This statement complies with:
- **WCAG 2.2 Level AA** - Web Content Accessibility Guidelines
- **EU Directive 2016/2102** - Accessibility of websites and mobile applications
- **Swedish Law 2018:1937** - Accessibility of digital public services (DIGG)

## Conformance Status

**${typeof conformanceLevel === 'string' && conformanceLevel.includes('Partial') ? 'Partially Conformant' : typeof conformanceLevel === 'string' && conformanceLevel.includes('Non') ? 'Non-conformant' : 'Conformant'}** with WCAG 2.2 Level AA

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

${knownLimitations ? `## Known Limitations\n\n${knownLimitations}\n\n` : ''}

## Alternative Access

If you encounter content that is not accessible, you may request it in an alternative format:
- Contact us using the details below to request alternative formats
- We will provide the content in an accessible format within a reasonable time frame
- Alternative formats include: Plain text, large print, audio, or other formats upon request

## Assessment Methodology

This accessibility statement was created based on the following evaluation methods:

${methodology.map(method => `- ${method}`).join('\n')}

## Technical Specifications

Accessibility of this website relies on the following technologies:

${technicalSpecs.map(spec => `- ${spec}`).join('\n')}

These technologies are relied upon for conformance with the accessibility standards used.

## Feedback and Contact Information

We welcome your feedback on the accessibility of ${organizationName}. 
Please contact us if you encounter accessibility barriers:

- **Email:** ${contactEmail}
${contactPhone ? `- **Phone:** ${contactPhone}` : ''}

**Response time:** We aim to respond to accessibility feedback within 5 business days.

## Enforcement and Complaints (DIGG)

If you are not satisfied with our response, you have the right to lodge a complaint.

**For Swedish public sector organizations:** Contact the Swedish Agency for Digital Government (DIGG):
- Website: https://www.digg.se/
- Information about complaints: https://www.digg.se/tdosanmalan

**For other EU countries:** Contact your national enforcement body responsible for accessibility legislation.

---

*This statement was generated on ${statementDate} using the Ally Checker accessibility audit tool.  
Statement prepared in accordance with WCAG 2.2 Level AA, EU Directive 2016/2102, and Swedish Law 2018:1937 (DIGG).*
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
${knownLimitations ? `\nKnown Limitations:\n${knownLimitations}` : ''}

This assessment is based on a comprehensive audit conducted on ${auditDate}, 
evaluating compliance with the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA.

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

ALTERNATIVE ACCESS

If you encounter difficulties accessing content or features on this website, 
we can provide the information in alternative formats. Please contact us using 
the information below to request:
- Documents in alternative formats (PDF, Word, large print, etc.)
- Information via email, phone, or postal mail
- Assistance accessing specific features or content

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
${contactPhone ? `Phone: ${contactPhone}` : ''}

We aim to respond to accessibility feedback within 5 business days.

ENFORCEMENT AND COMPLAINTS

If you are not satisfied with our response, you have the right to lodge a complaint 
with your national enforcement body responsible for accessibility legislation.

For Swedish organizations (Lag 2018:1937 om tillgänglighet till digital offentlig service):
Contact DIGG (Agency for Digital Government)
Website: https://www.digg.se/tdosanmalan
Email: tdosanmalan@digg.se

For EU organizations (EU Directive 2016/2102):
Contact your national enforcement body as listed on the European Commission's website.

---
This statement complies with WCAG 2.2 Level AA, EU Directive 2016/2102, and Swedish Law 2018:1937.
Generated on ${statementDate} using the Ally Checker accessibility audit tool.
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
