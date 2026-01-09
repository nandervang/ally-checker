import type { StatementData, StatementTemplate } from '../types';
import { formatDate } from '../utils';

/**
 * DIGG Accessibility Statement Template (Swedish)
 * Based on: Swedish Accessibility Law (2018:1937) and DIGG guidelines
 * Required by Swedish public sector websites
 */

function generateDIGGStatement(data: StatementData): string {
  const { metadata, contact, conformance, limitations, technicalSpecs, assessment } = data;
  
  const conformanceText = {
    'full': 'Fullt förenlig',
    'partial': 'Delvis förenlig',
    'non-conformant': 'Inte förenlig'
  }[conformance.status];

  const limitationsHTML = limitations.length > 0 ? `
    <h2>Kända tillgänglighetsproblem</h2>
    <p>Trots våra ansträngningar att säkerställa tillgängligheten för ${metadata.organizationName} finns det några begränsningar. Nedan följer en beskrivning av kända begränsningar och möjliga lösningar.</p>
    <ul>
      ${limitations.map(lim => `
        <li>
          <strong>${lim.title}</strong>: ${lim.description}
          ${lim.affectedAreas && lim.affectedAreas.length > 0 ? `<br><em>Berörda områden:</em> ${lim.affectedAreas.join(', ')}` : ''}
          ${lim.wcagCriterion ? `<br><em>WCAG-kriterium:</em> ${lim.wcagCriterion}` : ''}
          ${lim.workaround ? `<br><em>Lösning:</em> ${lim.workaround}` : ''}
          ${lim.plannedFix ? `<br><em>Planerad åtgärd:</em> ${lim.plannedFix}${lim.plannedFixDate ? ` (senast ${formatDate(lim.plannedFixDate, 'sv-SE')})` : ''}` : ''}
        </li>
      `).join('')}
    </ul>
  ` : '';

  const disproportionateBurdenHTML = data.disproportionateBurden?.hasDisproportionateBurden ? `
    <h2>Oproportionell börda</h2>
    <p>${data.disproportionateBurden.explanation || ''}</p>
    ${data.disproportionateBurden.affectedContent ? `
      <p>Detta gäller:</p>
      <ul>
        ${data.disproportionateBurden.affectedContent.map(content => `<li>${content}</li>`).join('')}
      </ul>
    ` : ''}
    ${data.disproportionateBurden.justification ? `
      <h3>Motivering</h3>
      <p>${data.disproportionateBurden.justification}</p>
    ` : ''}
  ` : '';

  const enforcementHTML = `
    <h2>Tillsyn</h2>
    <p>Myndigheten för digital förvaltning (DIGG) har ansvar för tillsyn över lagen om tillgänglighet till digital offentlig service. Om du inte är nöjd med hur vi hanterat dina synpunkter kan du kontakta DIGG och påtala det.</p>
    <p>
      <strong>Myndigheten för digital förvaltning (DIGG)</strong><br>
      Webbplats: <a href="https://www.digg.se/">www.digg.se</a><br>
      E-post: <a href="mailto:digg@digg.se">digg@digg.se</a><br>
      Telefon: <a href="tel:+4677175000">0771-75 00 00</a>
    </p>
  `;

  return `
    <article lang="sv">
      <h1>Tillgänglighetsredogörelse för ${metadata.organizationName}</h1>
      
      ${data.customIntro || `
        <p>Detta är en tillgänglighetsredogörelse för ${metadata.websiteUrl}.</p>
        <p>${metadata.organizationName} är engagerad i att göra vår webbplats tillgänglig, i enlighet med lagen (2018:1937) om tillgänglighet till digital offentlig service.</p>
      `}
      
      <p>Denna tillgänglighetsredogörelse gäller <strong>${metadata.websiteUrl}</strong>.</p>

      <h2>Hur tillgänglig är webbplatsen?</h2>
      <p>
        Vi är medvetna om att delar av webbplatsen inte är helt tillgängliga. Se avsnittet om innehåll som inte är tillgängligt nedan för mer information.
      </p>

      <h2>Överensstämmelse med lagkrav</h2>
      <p>
        Webbplatsen är <strong>${conformanceText}</strong> med lagen om tillgänglighet till digital offentlig service på grund av de brister som beskrivs nedan.
      </p>
      <p>
        Webbplatsen följer <a href="https://www.w3.org/Translations/WCAG21-sv/">Riktlinjer för tillgängligt webbinnehåll (WCAG) ${conformance.wcagVersion}</a> nivå ${conformance.wcagLevel}.
      </p>

      <h2>Innehåll som inte är tillgängligt</h2>
      <p>Det innehåll som beskrivs nedan är på ett eller annat sätt inte helt tillgängligt.</p>
      
      ${limitationsHTML || '<p>Inga kända tillgänglighetsproblem har identifierats.</p>'}

      ${disproportionateBurdenHTML}

      ${data.thirdPartyContent?.hasThirdPartyContent ? `
        <h3>Innehåll från tredje part</h3>
        <p>${data.thirdPartyContent.description || 'Vissa delar av webbplatsen innehåller material från tredje part som vi inte har full kontroll över.'}</p>
        ${data.thirdPartyContent.providers && data.thirdPartyContent.providers.length > 0 ? `
          <p>Detta inkluderar innehåll från:</p>
          <ul>
            ${data.thirdPartyContent.providers.map(provider => `<li>${provider}</li>`).join('')}
          </ul>
        ` : ''}
      ` : ''}

      ${data.pdfDocumentsIncluded ? `
        <h3>PDF-dokument</h3>
        <p>Vissa PDF-dokument på webbplatsen publicerades innan lagen om tillgänglighet till digital offentlig service trädde i kraft och är därför undantagna från lagens krav.</p>
      ` : ''}

      <h2>Vad gör vi för att förbättra tillgängligheten?</h2>
      <p>${metadata.organizationName} arbetar kontinuerligt med att förbättra webbplatsens tillgänglighet.</p>
      ${limitations.some(lim => lim.plannedFix) ? `
        <p>Planerade åtgärder:</p>
        <ul>
          ${limitations.filter(lim => lim.plannedFix).map(lim => `
            <li>${lim.plannedFix}${lim.plannedFixDate ? ` (senast ${formatDate(lim.plannedFixDate, 'sv-SE')})` : ''}</li>
          `).join('')}
        </ul>
      ` : ''}

      <h2>Ge oss feedback</h2>
      <p>Vi välkomnar dina synpunkter om tillgängligheten på ${metadata.organizationName}. Låt oss veta om du stöter på tillgänglighetshinder:</p>
      <ul>
        <li>E-post: <a href="mailto:${contact.email}">${contact.email}</a></li>
        ${contact.phone ? `<li>Telefon: <a href="tel:${contact.phone}">${contact.phone}</a></li>` : ''}
        ${contact.feedbackUrl ? `<li>Feedbackformulär: <a href="${contact.feedbackUrl}">Lämna synpunkter</a></li>` : ''}
      </ul>
      <p>Vi strävar efter att svara på feedback inom 5 arbetsdagar.</p>

      ${enforcementHTML}

      <h2>Teknisk information</h2>
      <p>Webbplatsens tillgänglighet är beroende av följande tekniker för att fungera:</p>
      <ul>
        ${technicalSpecs.technologies.map(tech => `<li>${tech}</li>`).join('')}
      </ul>

      <h2>Hur vi testat webbplatsen</h2>
      <p>Webbplatsen har testats av ${assessment.method === 'self' ? 'oss själva' : assessment.method === 'external' ? 'extern part' : 'både oss själva och extern part'}.</p>
      <p>Senaste bedömningen gjordes den <time datetime="${assessment.assessmentDate}">${formatDate(assessment.assessmentDate, 'sv-SE')}</time>.</p>
      ${assessment.tools && assessment.tools.length > 0 ? `
        <p>Testverktyg som användes:</p>
        <ul>
          ${assessment.tools.map(tool => `<li>${tool}</li>`).join('')}
        </ul>
      ` : ''}

      <h2>När redogörelsen upprättades och uppdaterades</h2>
      <p>Denna tillgänglighetsredogörelse upprättades den <time datetime="${metadata.statementDate}">${formatDate(metadata.statementDate, 'sv-SE')}</time>.</p>
      <p>Redogörelsen uppdaterades senast den <time datetime="${metadata.lastReviewDate}">${formatDate(metadata.lastReviewDate, 'sv-SE')}</time>.</p>
      ${metadata.nextReviewDate ? `<p>Nästa översyn planeras till <time datetime="${metadata.nextReviewDate}">${formatDate(metadata.nextReviewDate, 'sv-SE')}</time>.</p>` : ''}

      ${data.customOutro || ''}
      ${data.additionalInfo ? `
        <h2>Ytterligare information</h2>
        <p>${data.additionalInfo}</p>
      ` : ''}
    </article>
  `;
}

export const diggTemplate: StatementTemplate = {
  id: 'digg-swedish',
  name: 'DIGG Tillgänglighetsredogörelse',
  description: 'Svensk tillgänglighetsredogörelse enligt lagen (2018:1937) om tillgänglighet till digital offentlig service',
  locale: 'sv-SE',
  authority: 'digg',
  requiredSections: [
    'how_accessible',
    'conformance_status',
    'non_accessible_content',
    'improvements',
    'feedback',
    'enforcement',
    'technical_specifications',
    'testing_approach',
    'dates'
  ],
  optionalSections: [
    'disproportionate_burden',
    'third_party_content',
    'pdf_documents',
    'additional_information'
  ],
  generate: generateDIGGStatement
};
