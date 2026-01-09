/**
 * Accessibility Statement Types
 * 
 * Based on:
 * - W3C WAI Accessibility Statement Generator
 * - DIGG Swedish Accessibility Law (2018:1937)
 * - Magenta A11y Best Practices
 */

export type ConformanceStatus = 'full' | 'partial' | 'non-conformant';
export type WCAGLevel = 'A' | 'AA' | 'AAA';
export type Locale = 'sv-SE' | 'en-US';

export interface StatementMetadata {
  organizationName: string;
  websiteUrl: string;
  statementDate: string; // ISO date
  lastReviewDate: string; // ISO date
  nextReviewDate?: string; // ISO date
  locale: Locale;
  approver?: string; // Name of person who approved the statement
}

export interface ContactInformation {
  email: string;
  phone?: string;
  feedbackUrl?: string;
  feedbackFormUrl?: string;
  responseTime?: string; // e.g., "3 business days"
}

export interface ConformanceInformation {
  status: ConformanceStatus;
  wcagLevel: WCAGLevel;
  wcagVersion: string; // e.g., "2.2"
  additionalRequirements?: string; // e.g., "EN 301 549"
}

export interface KnownLimitation {
  title: string;
  description: string;
  wcagCriterion?: string; // e.g., "1.1.1"
  affectedAreas?: string[]; // e.g., ["Images in blog posts", "PDF documents"]
  workaround?: string;
  plannedFix?: string;
  plannedFixDate?: string; // ISO date
}

export interface DisproportionateBurden {
  hasDisproportionateBurden: boolean;
  explanation?: string;
  affectedContent?: string[];
  justification?: string;
}

export interface TechnicalSpecifications {
  technologies: string[]; // e.g., ["HTML5", "CSS3", "JavaScript", "ARIA"]
  browsers: string[]; // e.g., ["Chrome 120+", "Firefox 121+", "Safari 17+"]
  assistiveTechnologies?: string[]; // e.g., ["NVDA", "JAWS", "VoiceOver"]
}

export interface AssessmentInformation {
  method: 'self' | 'external' | 'both';
  assessmentDate: string; // ISO date
  assessor?: string; // Organization/person who performed assessment
  tools?: string[]; // e.g., ["axe DevTools", "WAVE", "Manual testing"]
  wcagTechniques?: string[]; // WCAG technique IDs
  scope?: string; // Description of what was tested
}

export interface StatementData {
  metadata: StatementMetadata;
  contact: ContactInformation;
  conformance: ConformanceInformation;
  limitations: KnownLimitation[];
  disproportionateBurden?: DisproportionateBurden;
  technicalSpecs: TechnicalSpecifications;
  assessment: AssessmentInformation;
  
  // Optional sections
  mobileAppIncluded?: boolean;
  pdfDocumentsIncluded?: boolean;
  thirdPartyContent?: {
    hasThirdPartyContent: boolean;
    description?: string;
    providers?: string[];
  };
  
  // Content customization
  customIntro?: string;
  customOutro?: string;
  additionalInfo?: string;
}

export interface StatementTemplate {
  id: string;
  name: string;
  description: string;
  locale: Locale;
  authority: 'w3c' | 'digg' | 'magenta';
  requiredSections: string[];
  optionalSections: string[];
  
  // Template generator function
  generate: (data: StatementData) => string; // Returns HTML
}

export interface StatementGenerationOptions {
  templateId?: string; // If not provided, select based on locale
  includeMetadata?: boolean; // Include meta tags in HTML
  includeStyles?: boolean; // Include inline CSS
  format?: 'html' | 'embeddable' | 'text';
}
