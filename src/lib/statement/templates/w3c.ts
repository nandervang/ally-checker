import type { StatementData, StatementTemplate } from '../types';
import { formatDate } from '../utils';

/**
 * W3C WAI Accessibility Statement Template (English)
 * Based on: https://www.w3.org/WAI/planning/statements/
 */

function generateW3CStatement(data: StatementData): string {
  const { metadata, contact, conformance, limitations, technicalSpecs, assessment } = data;
  
  const conformanceText = {
    'full': 'Fully conformant',
    'partial': 'Partially conformant',
    'non-conformant': 'Not conformant'
  }[conformance.status];

  const limitationsHTML = limitations.length > 0 ? `
    <h2>Known limitations</h2>
    <p>Despite our best efforts to ensure accessibility of ${metadata.organizationName}, there are some limitations. Below is a description of known limitations and potential solutions.</p>
    <ul>
      ${limitations.map(lim => `
        <li>
          <strong>${lim.title}</strong>: ${lim.description}
          ${lim.workaround ? `<br><em>Workaround:</em> ${lim.workaround}` : ''}
          ${lim.plannedFix ? `<br><em>Planned fix:</em> ${lim.plannedFix}${lim.plannedFixDate ? ` (by ${formatDate(lim.plannedFixDate, 'en-US')})` : ''}` : ''}
        </li>
      `).join('')}
    </ul>
  ` : '';

  const disproportionateBurdenHTML = data.disproportionateBurden?.hasDisproportionateBurden ? `
    <h2>Disproportionate burden</h2>
    <p>${data.disproportionateBurden.explanation || ''}</p>
    ${data.disproportionateBurden.affectedContent ? `
      <p>This applies to:</p>
      <ul>
        ${data.disproportionateBurden.affectedContent.map(content => `<li>${content}</li>`).join('')}
      </ul>
    ` : ''}
  ` : '';

  return `
    <article>
      <h1>Accessibility Statement for ${metadata.organizationName}</h1>
      
      ${data.customIntro || `
        <p>${metadata.organizationName} is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.</p>
      `}

      <h2>Conformance status</h2>
      <p>
        The <a href="https://www.w3.org/WAI/WCAG${conformance.wcagLevel === 'AAA' ? '22' : '21'}/quickref/?currentsidebar=%23col_customize&levels=${conformance.wcagLevel.toLowerCase()}">
          Web Content Accessibility Guidelines (WCAG) ${conformance.wcagVersion}
        </a> defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA.
      </p>
      <p>
        <strong>${metadata.websiteUrl}</strong> is <strong>${conformanceText}</strong> with <strong>WCAG ${conformance.wcagVersion} Level ${conformance.wcagLevel}</strong>.
        ${conformance.status === 'partial' ? ' This means that some parts of the content do not fully conform to the accessibility standard.' : ''}
        ${conformance.status === 'non-conformant' ? ' This means that the content does not conform to the accessibility standard.' : ''}
      </p>

      ${limitationsHTML}

      ${disproportionateBurdenHTML}

      <h2>Feedback</h2>
      <p>We welcome your feedback on the accessibility of ${metadata.organizationName}. Please let us know if you encounter accessibility barriers:</p>
      <ul>
        <li>E-mail: <a href="mailto:${contact.email}">${contact.email}</a></li>
        ${contact.phone ? `<li>Phone: <a href="tel:${contact.phone}">${contact.phone}</a></li>` : ''}
        ${contact.feedbackUrl ? `<li>Feedback form: <a href="${contact.feedbackUrl}">Submit feedback</a></li>` : ''}
      </ul>
      <p>We try to respond to feedback within 5 business days.</p>

      <h2>Technical specifications</h2>
      <p>Accessibility of ${metadata.organizationName} relies on the following technologies to work with the particular combination of web browser and any assistive technologies or plugins installed on your computer:</p>
      <ul>
        ${technicalSpecs.technologies.map(tech => `<li>${tech}</li>`).join('')}
      </ul>
      <p>These technologies are relied upon for conformance with the accessibility standards used.</p>

      <h2>Assessment approach</h2>
      <p>${metadata.organizationName} assessed the accessibility of ${metadata.websiteUrl} by the following approaches:</p>
      <ul>
        ${assessment.method === 'self' || assessment.method === 'both' ? '<li>Self-evaluation</li>' : ''}
        ${assessment.method === 'external' || assessment.method === 'both' ? '<li>External evaluation</li>' : ''}
      </ul>
      ${assessment.tools && assessment.tools.length > 0 ? `
        <p>Testing tools used:</p>
        <ul>
          ${assessment.tools.map(tool => `<li>${tool}</li>`).join('')}
        </ul>
      ` : ''}

      <h2>Date</h2>
      <p>This statement was created on <time datetime="${metadata.statementDate}">${formatDate(metadata.statementDate, metadata.locale)}</time> using the W3C Accessibility Statement Generator.</p>
      <p>This statement was last reviewed on <time datetime="${metadata.lastReviewDate}">${formatDate(metadata.lastReviewDate, metadata.locale)}</time>.</p>

      ${data.customOutro || ''}
      ${data.additionalInfo ? `
        <h2>Additional information</h2>
        <p>${data.additionalInfo}</p>
      ` : ''}
    </article>
  `;
}

export const w3cTemplate: StatementTemplate = {
  id: 'w3c-wai-english',
  name: 'W3C WAI Accessibility Statement',
  description: 'Standard W3C Web Accessibility Initiative statement template for international use',
  locale: 'en-US',
  authority: 'w3c',
  requiredSections: [
    'conformance_status',
    'feedback',
    'technical_specifications',
    'assessment_approach',
    'date'
  ],
  optionalSections: [
    'known_limitations',
    'disproportionate_burden',
    'additional_information'
  ],
  generate: generateW3CStatement
};
