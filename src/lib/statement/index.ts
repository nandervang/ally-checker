/**
 * Accessibility Statement Templates
 * Exports all available statement templates and template utilities
 */

export { w3cTemplate } from './templates/w3c';
export { diggTemplate } from './templates/digg';
export { magentaTemplate } from './templates/magenta';

export type {
  StatementData,
  StatementMetadata,
  ContactInformation,
  ConformanceInformation,
  KnownLimitation,
  DisproportionateBurden,
  ThirdPartyContent,
  TechnicalSpecifications,
  AssessmentApproach,
  StatementTemplate
} from './types';

export {
  formatDate,
  escapeHtml,
  sanitizeHtml,
  validateStatementData,
  generateFilename,
  htmlToPlainText,
  isValidUrl,
  isValidEmail,
  getWcagCriterionUrl,
  getConformanceStatusText
} from './utils';

import type { StatementTemplate } from './types';
import { w3cTemplate } from './templates/w3c';
import { diggTemplate } from './templates/digg';
import { magentaTemplate } from './templates/magenta';

/**
 * All available templates
 */
export const templates: StatementTemplate[] = [
  w3cTemplate,
  diggTemplate,
  magentaTemplate
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): StatementTemplate | undefined {
  return templates.find(t => t.id === id);
}

/**
 * Get templates by locale
 */
export function getTemplatesByLocale(locale: string): StatementTemplate[] {
  return templates.filter(t => t.locale === locale);
}

/**
 * Get templates by authority
 */
export function getTemplatesByAuthority(authority: 'w3c' | 'digg' | 'magenta'): StatementTemplate[] {
  return templates.filter(t => t.authority === authority);
}

/**
 * Get recommended template based on locale and context
 */
export function getRecommendedTemplate(locale: string, isPublicSector: boolean = false): StatementTemplate {
  // Swedish public sector should use DIGG
  if (locale.startsWith('sv') && isPublicSector) {
    return diggTemplate;
  }
  
  // Swedish non-public-sector can use Magenta (best UX) or W3C
  if (locale.startsWith('sv')) {
    return magentaTemplate;
  }
  
  // Default to Magenta for best user experience, W3C is more formal
  return magentaTemplate;
}
