/**
 * Utility functions for accessibility statement generation
 */

/**
 * Format a date string according to locale
 * @param dateString - ISO date string or Date object
 * @param locale - BCP 47 language tag (e.g., 'en-US', 'sv-SE')
 * @returns Formatted date string
 */
export function formatDate(dateString: string | Date, locale: string = 'en-US'): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * Escape HTML special characters to prevent XSS
 * @param text - Text to escape
 * @returns Escaped text safe for HTML
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Validate that StatementData contains all required fields
 * @param data - Statement data to validate
 * @returns Validation result with errors if any
 */
export function validateStatementData(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Type guard check
  if (typeof data !== 'object' || data === null) {
    errors.push('Data must be an object');
    return { valid: false, errors };
  }

  const obj = data as Record<string, any>;

  // Required metadata fields
  if (!obj.metadata) {
    errors.push('Missing metadata object');
  } else {
    if (!obj.metadata.organizationName) errors.push('Missing organization name');
    if (!obj.metadata.websiteUrl) errors.push('Missing website URL');
    if (!obj.metadata.statementDate) errors.push('Missing statement date');
    if (!obj.metadata.lastReviewDate) errors.push('Missing last review date');
    if (!obj.metadata.locale) errors.push('Missing locale');
  }

  // Required contact fields
  if (!obj.contact) {
    errors.push('Missing contact object');
  } else {
    if (!obj.contact.email) errors.push('Missing contact email');
  }

  // Required conformance fields
  if (!obj.conformance) {
    errors.push('Missing conformance object');
  } else {
    if (!obj.conformance.wcagVersion) errors.push('Missing WCAG version');
    if (!obj.conformance.wcagLevel) errors.push('Missing WCAG level');
    if (!obj.conformance.status) errors.push('Missing conformance status');
    
    // Validate WCAG level
    if (obj.conformance.wcagLevel && !['A', 'AA', 'AAA'].includes(obj.conformance.wcagLevel)) {
      errors.push('Invalid WCAG level (must be A, AA, or AAA)');
    }
    
    // Validate conformance status
    if (obj.conformance.status && !['full', 'partial', 'non-conformant'].includes(obj.conformance.status)) {
      errors.push('Invalid conformance status');
    }
  }

  // Required limitations array (can be empty)
  if (!Array.isArray(obj.limitations)) {
    errors.push('Missing limitations array');
  }

  // Required technical specs
  if (!obj.technicalSpecs) {
    errors.push('Missing technical specifications');
  } else {
    if (!Array.isArray(obj.technicalSpecs.technologies) || obj.technicalSpecs.technologies.length === 0) {
      errors.push('Missing technologies in technical specifications');
    }
  }

  // Required assessment
  if (!obj.assessment) {
    errors.push('Missing assessment object');
  } else {
    if (!obj.assessment.method) errors.push('Missing assessment method');
    if (!obj.assessment.assessmentDate) errors.push('Missing assessment date');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize HTML content - strips script tags and dangerous attributes
 * @param html - HTML content to sanitize
 * @returns Sanitized HTML
 */
export function sanitizeHtml(html: string): string {
  // Remove script tags
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove dangerous event handlers
  cleaned = cleaned.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  cleaned = cleaned.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  cleaned = cleaned.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
  
  return cleaned;
}

/**
 * Generate a valid filename from organization name and date
 * @param organizationName - Name of the organization
 * @param date - Statement date
 * @returns Safe filename
 */
export function generateFilename(organizationName: string, date: string | Date = new Date()): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const dateStr = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Convert to safe filename
  const safeName = organizationName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `accessibility-statement-${safeName}-${dateStr}.html`;
}

/**
 * Extract plain text from HTML for preview/summary
 * @param html - HTML content
 * @param maxLength - Maximum length of extracted text
 * @returns Plain text excerpt
 */
export function htmlToPlainText(html: string, maxLength: number = 500): string {
  // Remove HTML tags
  let text = html.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
  
  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Truncate if needed
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + '...';
  }
  
  return text;
}

/**
 * Validate URL format
 * @param url - URL to validate
 * @returns True if valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate email format
 * @param email - Email to validate
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get WCAG criterion reference URL
 * @param criterion - WCAG criterion code (e.g., "1.1.1", "2.4.7")
 * @param version - WCAG version ("2.1" or "2.2")
 * @returns URL to W3C WCAG understanding document
 */
export function getWcagCriterionUrl(criterion: string, version: string = '2.2'): string {
  const versionPath = version === '2.2' ? 'WCAG22' : 'WCAG21';
  const criterionPath = criterion.replace(/\./g, '');
  return `https://www.w3.org/WAI/${versionPath}/Understanding/${criterionPath}.html`;
}

/**
 * Get localized conformance status text
 * @param status - Conformance status
 * @param locale - Locale code
 * @returns Localized status text
 */
export function getConformanceStatusText(
  status: 'full' | 'partial' | 'non-conformant',
  locale: string = 'en-US'
): string {
  const translations: Record<string, Record<string, string>> = {
    'en-US': {
      full: 'Fully Conformant',
      partial: 'Partially Conformant',
      'non-conformant': 'Not Conformant'
    },
    'sv-SE': {
      full: 'Fullt förenlig',
      partial: 'Delvis förenlig',
      'non-conformant': 'Inte förenlig'
    }
  };
  
  const lang = locale.split('-')[0];
  const localeKey = translations[locale] ? locale : (translations[lang] ? lang : 'en-US');
  
  return translations[localeKey][status] || status;
}
