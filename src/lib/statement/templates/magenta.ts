import type { StatementData, StatementTemplate } from '../types';
import { formatDate } from '../utils';

/**
 * Magenta A11y Accessibility Statement Template
 * Based on: Magenta A11y best practices and industry standards
 * Focus on user-friendly communication and actionable information
 */

function generateMagentaStatement(data: StatementData): string {
  const { metadata, contact, conformance, limitations, technicalSpecs, assessment } = data;
  
  const conformanceLabels = {
    'full': 'Fully Conformant',
    'partial': 'Partially Conformant',
    'non-conformant': 'Not Conformant'
  };

  const limitationsByPriority = limitations.reduce<Record<string, typeof limitations>>((acc, lim) => {
    const priority = lim.wcagCriterion?.startsWith('1.') ? 'high' :
                     lim.wcagCriterion?.startsWith('2.') ? 'medium' : 'low';
    if (!acc[priority]) acc[priority] = [];
    acc[priority].push(lim);
    return acc;
  }, {});

  const limitationsHTML = `
    <h2>Known Accessibility Issues</h2>
    <p>We're committed to transparency about our accessibility status. Below are known issues and how we're addressing them.</p>
    
    ${limitationsByPriority.high && limitationsByPriority.high.length > 0 ? `
      <div class="priority-high">
        <h3>High Priority Issues</h3>
        <p>These issues significantly impact user experience and are our top priority to fix.</p>
        <ul>
          ${limitationsByPriority.high.map(lim => `
            <li>
              <strong>${lim.title}</strong>
              <p>${lim.description}</p>
              ${lim.workaround ? `
                <div class="workaround">
                  <strong>Workaround:</strong> ${lim.workaround}
                </div>
              ` : ''}
              ${lim.plannedFix ? `
                <div class="plan">
                  <strong>Our Plan:</strong> ${lim.plannedFix}
                  ${lim.plannedFixDate ? ` <em>(Target: ${formatDate(lim.plannedFixDate, metadata.locale)})</em>` : ''}
                </div>
              ` : ''}
              ${lim.wcagCriterion ? `<small>Related to: ${lim.wcagCriterion}</small>` : ''}
            </li>
          `).join('')}
        </ul>
      </div>
    ` : ''}
    
    ${limitationsByPriority.medium && limitationsByPriority.medium.length > 0 ? `
      <div class="priority-medium">
        <h3>Medium Priority Issues</h3>
        <ul>
          ${limitationsByPriority.medium.map(lim => `
            <li>
              <strong>${lim.title}</strong>: ${lim.description}
              ${lim.workaround ? `<br><em>Workaround:</em> ${lim.workaround}` : ''}
              ${lim.plannedFix ? `<br><em>Fix planned:</em> ${lim.plannedFix}` : ''}
            </li>
          `).join('')}
        </ul>
      </div>
    ` : ''}
    
    ${limitationsByPriority.low && limitationsByPriority.low.length > 0 ? `
      <details>
        <summary>Low Priority Issues ({limitationsByPriority.low.length.toString()})</summary>
        <ul>
          ${limitationsByPriority.low.map(lim => `
            <li><strong>${lim.title}</strong>: ${lim.description}</li>
          `).join('')}
        </ul>
      </details>
    ` : ''}
  `;

  const styles = `
    <style>
      .accessibility-statement {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
        font-family: system-ui, -apple-system, sans-serif;
        line-height: 1.6;
        color: #1a1a1a;
      }
      .accessibility-statement h1 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
        color: #2d3748;
      }
      .accessibility-statement h2 {
        font-size: 1.75rem;
        margin-top: 2rem;
        margin-bottom: 1rem;
        color: #4a5568;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 0.5rem;
      }
      .accessibility-statement h3 {
        font-size: 1.25rem;
        margin-top: 1.5rem;
        color: #718096;
      }
      .conformance-badge {
        display: inline-block;
        padding: 0.5rem 1rem;
        border-radius: 0.25rem;
        font-weight: bold;
        margin: 1rem 0;
      }
      .conformance-badge.full {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }
      .conformance-badge.partial {
        background-color: #fff3cd;
        color: #856404;
        border: 1px solid #ffeeba;
      }
      .conformance-badge.non-conformant {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }
      .priority-high {
        border-left: 4px solid #e53e3e;
        padding-left: 1rem;
        margin: 1rem 0;
      }
      .priority-medium {
        border-left: 4px solid #ed8936;
        padding-left: 1rem;
        margin: 1rem 0;
      }
      .workaround, .plan {
        background-color: #f7fafc;
        padding: 0.75rem;
        margin: 0.5rem 0;
        border-left: 3px solid #4299e1;
      }
      .contact-card {
        background-color: #edf2f7;
        padding: 1.5rem;
        border-radius: 0.5rem;
        margin: 1rem 0;
      }
      details {
        margin: 1rem 0;
      }
      summary {
        cursor: pointer;
        font-weight: bold;
        padding: 0.5rem;
        background-color: #f7fafc;
        border-radius: 0.25rem;
      }
      summary:hover {
        background-color: #edf2f7;
      }
      .tech-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin: 1rem 0;
      }
      .tech-badge {
        background-color: #4299e1;
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.875rem;
      }
    </style>
  `;

  return `
    ${styles}
    <article class="accessibility-statement" lang="${metadata.locale}">
      <h1>Accessibility Statement for ${metadata.organizationName}</h1>
      
      ${data.customIntro || `
        <p class="intro">
          <strong>${metadata.organizationName}</strong> is committed to ensuring digital accessibility for people with disabilities. 
          We are continually improving the user experience for everyone and applying the relevant accessibility standards.
        </p>
      `}

      <h2>Our Commitment</h2>
      <p>
        This website (<a href="${metadata.websiteUrl}">${metadata.websiteUrl}</a>) conforms to the 
        <a href="https://www.w3.org/WAI/WCAG${conformance.wcagVersion === '2.2' ? '22' : '21'}/quickref/?versions=${conformance.wcagVersion}">
          Web Content Accessibility Guidelines (WCAG) ${conformance.wcagVersion}
        </a> at <strong>Level ${conformance.wcagLevel}</strong>.
      </p>
      
      <div class="conformance-badge ${conformance.status}">
        ${conformanceLabels[conformance.status]} - WCAG ${conformance.wcagVersion} Level ${conformance.wcagLevel}
      </div>

      ${limitations.length > 0 ? limitationsHTML : `
        <h2>Accessibility Status</h2>
        <p>✓ No known accessibility issues have been identified at this time.</p>
        <p>We continue to monitor and test to maintain this standard.</p>
      `}

      <h2>Help Us Improve</h2>
      <div class="contact-card">
        <p>We welcome your feedback on the accessibility of ${metadata.organizationName}. Please let us know if you encounter accessibility barriers:</p>
        <ul>
          <li><strong>Email:</strong> <a href="mailto:${contact.email}">${contact.email}</a></li>
          ${contact.phone ? `<li><strong>Phone:</strong> <a href="tel:${contact.phone}">${contact.phone}</a></li>` : ''}
          ${contact.feedbackUrl ? `<li><strong>Online Form:</strong> <a href="${contact.feedbackUrl}">Submit Feedback</a></li>` : ''}
        </ul>
        <p><strong>Response time:</strong> We try to respond to feedback within {contact.responseTime || '3 business days'}.</p>
      </div>

      ${data.disproportionateBurden?.hasDisproportionateBurden ? `
        <details>
          <summary>Content Exceptions</summary>
          <div>
            <h3>Disproportionate Burden</h3>
            <p>${data.disproportionateBurden.explanation || ''}</p>
            ${data.disproportionateBurden.justification ? `<p><strong>Justification:</strong> ${data.disproportionateBurden.justification}</p>` : ''}
          </div>
        </details>
      ` : ''}

      ${data.thirdPartyContent?.hasThirdPartyContent ? `
        <details>
          <summary>Third-Party Content</summary>
          <div>
            <p>${data.thirdPartyContent.description || 'Some content on this site is provided by third parties and may not be fully accessible.'}</p>
            ${data.thirdPartyContent.providers && data.thirdPartyContent.providers.length > 0 ? `
              <p>Third-party content includes material from: ${data.thirdPartyContent.providers.join(', ')}</p>
            ` : ''}
          </div>
        </details>
      ` : ''}

      <h2>Technical Specifications</h2>
      <p>This website relies on the following technologies for accessibility:</p>
      <div class="tech-list">
        ${technicalSpecs.technologies.map(tech => `<span class="tech-badge">${tech}</span>`).join('')}
      </div>
      ${technicalSpecs.browsers.length > 0 ? `
        <p><strong>Tested with:</strong> ${technicalSpecs.browsers.join(', ')}</p>
      ` : ''}
      ${technicalSpecs.assistiveTechnologies && technicalSpecs.assistiveTechnologies.length > 0 ? `
        <p><strong>Compatible assistive technologies:</strong> ${technicalSpecs.assistiveTechnologies.join(', ')}</p>
      ` : ''}

      <h2>Assessment Approach</h2>
      <p>
        ${metadata.organizationName} assessed the accessibility of ${metadata.websiteUrl} through 
        ${assessment.method === 'self' ? 'internal evaluation' : assessment.method === 'external' ? 'third-party assessment' : 'combined internal and external evaluation'}.
      </p>
      <p>Last assessed: <time datetime="${assessment.assessmentDate}">${formatDate(assessment.assessmentDate, metadata.locale)}</time></p>
      ${assessment.tools && assessment.tools.length > 0 ? `
        <details>
          <summary>Testing Tools Used</summary>
          <ul>
            ${assessment.tools.map(tool => `<li>${tool}</li>`).join('')}
          </ul>
        </details>
      ` : ''}
      ${assessment.scope ? `
        <details>
          <summary>Testing Scope</summary>
          <p>{assessment.scope}</p>
        </details>
      ` : ''}

      <h2>Formal Approval</h2>
      <p>
        This Accessibility Statement was approved on <time datetime="${metadata.statementDate}">${formatDate(metadata.statementDate, metadata.locale)}</time>.
      </p>
      ${metadata.approver ? `<p>Approved by: <strong>{metadata.approver}</strong></p>` : ''}
      <p>Last reviewed: <time datetime="${metadata.lastReviewDate}">${formatDate(metadata.lastReviewDate, metadata.locale)}</time></p>
      ${metadata.nextReviewDate ? `
        <p>Next scheduled review: <time datetime="${metadata.nextReviewDate}">${formatDate(metadata.nextReviewDate, metadata.locale)}</time></p>
      ` : ''}

      ${data.additionalInfo ? `
        <h2>Additional Information</h2>
        <p>${data.additionalInfo}</p>
      ` : ''}

      ${data.customOutro || `
        <footer style="margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; font-size: 0.875rem; color: #718096;">
          <p>
            This statement demonstrates our ongoing commitment to accessibility and is part of our broader 
            effort to ensure that everyone can access and benefit from our digital services.
          </p>
        </footer>
      `}
    </article>
  `;
}

export const magentaTemplate: StatementTemplate = {
  id: 'magenta-a11y',
  name: 'Magenta A11y Statement',
  description: 'User-friendly accessibility statement following Magenta A11y best practices',
  locale: 'en-US',
  authority: 'magenta',
  requiredSections: [
    'commitment',
    'conformance_status',
    'known_issues',
    'feedback',
    'technical_specifications',
    'assessment_approach',
    'formal_approval'
  ],
  optionalSections: [
    'disproportionate_burden',
    'third_party_content',
    'additional_information'
  ],
  generate: generateMagentaStatement
};
