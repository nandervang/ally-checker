/**
 * Professional Report Generation for Accessibility Audits
 * 
 * Supports multiple high-quality formats:
 * - ETU Word (.docx) - Professional branded reports with proper document structure
 * - HTML - Semantic, accessible web reports
 * - Markdown - Developer-friendly formatted reports
 * 
 * All formats follow WCAG accessibility guidelines and include:
 * - Proper document structure and headings
 * - Language tagging
 * - Clear visual hierarchy
 * - Remediation recommendations
 * - WCAG compliance scorecard
 */

import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  PageBreak
} from "docx";

export interface ReportIssue {
  wcag_principle: "Perceivable" | "Operable" | "Understandable" | "Robust";
  success_criterion: string;
  success_criterion_name?: string;
  severity: "critical" | "serious" | "moderate" | "minor";
  description: string;
  element_snippet?: string;
  element_selector?: string;
  element_context?: string;
  code_location?: string;
  detection_source: "axe-core" | "ai-heuristic";
  remediation: string;
  wcag_reference_url?: string;
  // ETU Swedish report fields
  wcag_explanation?: string;
  how_to_reproduce?: string;
  user_impact?: string;
  fix_priority?: string;
  en_301_549_ref?: string;
  webbriktlinjer_url?: string;
  screenshot_url?: string;
}

export interface AuditData {
  url?: string;
  input_type: "url" | "html_full" | "html_snippet" | "issue_only";
  created_at: string;
  completed_at?: string;
  total_issues: number;
  perceivable_count: number;
  operable_count: number;
  understandable_count: number;
  robust_count: number;
  issues: ReportIssue[];
}

export interface ReportConfig {
  template: "etu-swedish" | "wcag-international" | "vpat-us" | "simple" | "technical";
  locale: "sv-SE" | "en-US";
  format: "word" | "html" | "markdown";
  include_ai_summary?: boolean;
  executive_summary?: string;
}

// Template-specific configurations
const TEMPLATE_CONFIGS = {
  "etu-swedish": {
    name: "ETU Swedish",
    colors: { primary: "003366", secondary: "006699", accent: "0099CC" },
    font: "Calibri",
    includeEN301549: true,
    includeWebbriktlinjer: true,
  },
  "wcag-international": {
    name: "WCAG International",
    colors: { primary: "005A9C", secondary: "0077B3", accent: "00A0E0" },
    font: "Arial",
    includeWCAG21: true,
    includeWCAG22: true,
  },
  "vpat-us": {
    name: "VPAT Section 508",
    colors: { primary: "112E51", secondary: "205493", accent: "0071BC" },
    font: "Arial",
    includeSection508: true,
    includeVPATFormat: true,
  },
  "simple": {
    name: "Simple Developer",
    colors: { primary: "333333", secondary: "666666", accent: "0066CC" },
    font: "Consolas",
    minimal: true,
    includeCodeExamples: true,
  },
  "technical": {
    name: "Technical Analysis",
    colors: { primary: "1A1A1A", secondary: "404040", accent: "FF6600" },
    font: "Courier New",
    includeDOM: true,
    includeImplementation: true,
  }
};

const TRANSLATIONS = {
  "sv-SE": {
    reportTitle: "Tillgänglighetsrapport",
    subtitle: "WCAG 2.2 AA Kompatibilitetsbedömning",
    auditedSource: "Granskad källa:",
    auditDate: "Granskningsdatum:",
    inputType: "Typ av input:",
    totalIssues: "Totalt antal problem:",
    executiveSummary: "Sammanfattning",
    overview: "Översikt",
    overviewIntro: (count: number) => 
      `Denna granskning identifierade ${count} tillgänglighetsproblem organiserade enligt WCAG 2.2 AA:s fyra principer:`,
    perceivable: "Möjlig att uppfatta",
    operable: "Hanterbar",
    understandable: "Begriplig",
    robust: "Robust",
    issuesByPrinciple: "Problem per princip",
    severity: "Allvarlighet:",
    wcagCriterion: "WCAG-kriterium:",
    description: "Beskrivning:",
    remediation: "Åtgärd:",
    element: "Element:",
    complianceScorecard: "Kompatibilitetsöversikt",
    generatedBy: (date: string) => `Genererad av Ally Checker - ${date}`,
    // Template-specific
    section508Compliance: "Section 508 Efterlevnad",
    conformanceLevel: "Efterlevnadsnivå:",
    implementationDetails: "Implementeringsdetaljer:",
    domPath: "DOM-sökväg:",
    codeExample: "Kodexempel:",
    beforeFix: "Före åtgärd:",
    afterFix: "Efter åtgärd:",
    en301549: "EN 301 549 Kapitel:",
    webbriktlinjer: "Webbriktlinjer:",
    // ETU Swedish specific
    wcagExplanation: "WCAG-förklaring:",
    howToReproduce: "Hur man återskapar felet",
    userImpact: "Konsekvens för användaren",
    fixPriority: "Åtgärda:",
    category: "Kategori:",
    relatedCriteria: "Relaterade krav",
  },
  "en-US": {
    reportTitle: "Accessibility Audit Report",
    subtitle: "WCAG 2.2 AA Compliance Assessment",
    auditedSource: "Audited Source:",
    auditDate: "Audit Date:",
    inputType: "Input Type:",
    totalIssues: "Total Issues:",
    executiveSummary: "Executive Summary",
    overview: "Overview",
    overviewIntro: (count: number) => 
      `This audit identified ${count} accessibility issues organized by the four WCAG 2.2 AA principles:`,
    perceivable: "Perceivable",
    operable: "Operable",
    understandable: "Understandable",
    robust: "Robust",
    issuesByPrinciple: "Issues by Principle",
    severity: "Severity:",
    wcagCriterion: "WCAG Criterion:",
    description: "Description:",
    remediation: "Remediation:",
    element: "Element:",
    complianceScorecard: "Compliance Scorecard",
    generatedBy: (date: string) => `Generated by Ally Checker - ${date}`,
    // Template-specific
    section508Compliance: "Section 508 Compliance",
    conformanceLevel: "Conformance Level:",
    implementationDetails: "Implementation Details:",
    domPath: "DOM Path:",
    codeExample: "Code Example:",
    beforeFix: "Before Fix:",
    afterFix: "After Fix:",
    en301549: "EN 301 549 Reference:",
    webbriktlinjer: "Webbriktlinjer:",
    // ETU Swedish specific (English versions)
    wcagExplanation: "WCAG Explanation:",
    howToReproduce: "How to Reproduce",
    userImpact: "User Impact",
    fixPriority: "Fix Priority:",
    category: "Category:",
    relatedCriteria: "Related Criteria",
  }
};

/**
 * Generate professional Word document (.docx) report
 */
export async function generateWordReport(
  auditData: AuditData,
  config: ReportConfig
): Promise<Buffer> {
  const t = TRANSLATIONS[config.locale];
  const templateConfig = TEMPLATE_CONFIGS[config.template];
  const date = new Date(auditData.created_at);
  const formattedDate = date.toLocaleDateString(config.locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  const sections: any[] = [];

  // Title Page - template-specific styling
  const titleParagraph = new Paragraph({
    text: t.reportTitle,
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  });
  
  // Add template name to subtitle for clarity
  const subtitleText = config.template === "vpat-us" 
    ? "Section 508 Compliance Report - WCAG 2.2 AA"
    : config.template === "simple"
    ? "Quick Accessibility Check"
    : config.template === "technical"
    ? "Technical Accessibility Analysis"
    : t.subtitle;

  sections.push({
    children: [
      // Main title with template-specific color
      new Paragraph({
        text: t.reportTitle,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        run: {
          size: templateConfig.minimal ? 48 : 56, // Smaller for simple template
          bold: true,
          color: templateConfig.colors.primary.replace("#", ""),
          font: templateConfig.font,
        }
      }),
      
      // Subtitle
      new Paragraph({
        text: subtitleText,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        run: {
          size: 36, // 18pt
          color: templateConfig.colors.secondary.replace("#", ""),
          font: templateConfig.font,
        }
      }),

      // Metadata Table
      createMetadataTable(auditData, t, formattedDate, config),

      new Paragraph({ children: [new PageBreak()] }),
    ]
  });

  // Executive Summary (if provided and not simple template)
  if (config.executive_summary && !templateConfig.minimal) {
    sections.push({
      children: [
        new Paragraph({
          text: t.executiveSummary,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
        }),
        new Paragraph({
          text: config.executive_summary,
          spacing: { after: 240 },
        }),
        new Paragraph({ children: [new PageBreak()] }),
      ]
    });
  }

  // Overview Section
  if (!templateConfig.minimal) {
    sections.push({
      children: [
        new Paragraph({
          text: t.overview,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
        }),
        new Paragraph({
          text: t.overviewIntro(auditData.total_issues),
          spacing: { after: 120 },
        }),
        ...createPrincipleBreakdown(auditData, t),
      ]
    });
  }

  // Issues by Principle
  const principles: Array<keyof typeof auditData & string> = [
    'perceivable', 
    'operable', 
    'understandable', 
    'robust'
  ];

  for (const principle of principles) {
    const principleKey = principle.charAt(0).toUpperCase() + principle.slice(1) as ReportIssue['wcag_principle'];
    const issues = auditData.issues.filter(
      issue => issue.wcag_principle === principleKey
    );

    if (issues.length === 0) continue;

    sections.push({
      children: [
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({
          text: t[principle as keyof typeof t] as string,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
        }),
        ...createIssuesList(issues, t, config),
      ]
    });
  }

  // Compliance Scorecard
  sections.push({
    children: [
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({
        text: t.complianceScorecard,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
      }),
      createComplianceTable(auditData, t),
    ]
  });

  // Footer
  sections.push({
    children: [
      new Paragraph({
        text: t.generatedBy(new Date().toLocaleDateString(config.locale)),
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
        run: {
          size: 20,
          color: "666666",
        }
      }),
    ]
  });

  const doc = new Document({
    sections: sections.map(section => ({
      properties: {},
      children: section.children
    }))
  });

  return await Packer.toBuffer(doc);
}

function createMetadataTable(
  auditData: AuditData,
  t: typeof TRANSLATIONS["sv-SE"],
  formattedDate: string,
  config: ReportConfig
): Table {
  const templateConfig = TEMPLATE_CONFIGS[config.template];
  const rows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: t.auditedSource })] }),
        new TableCell({ children: [new Paragraph({ text: auditData.url || "HTML Input" })] }),
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: t.auditDate })] }),
        new TableCell({ children: [new Paragraph({ text: formattedDate })] }),
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: t.inputType })] }),
        new TableCell({ children: [new Paragraph({ text: auditData.input_type })] }),
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: t.totalIssues })] }),
        new TableCell({ children: [new Paragraph({ text: auditData.total_issues.toString() })] }),
      ]
    }),
  ];

  // Add template-specific rows
  if (templateConfig.includeVPATFormat) {
    rows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: t.conformanceLevel })] }),
          new TableCell({ children: [new Paragraph({ text: "WCAG 2.2 Level AA" })] }),
        ]
      })
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
    },
    rows
  });
}

function createPrincipleBreakdown(
  auditData: AuditData,
  t: typeof TRANSLATIONS["sv-SE"]
): Paragraph[] {
  const principles = [
    { label: t.perceivable, count: auditData.perceivable_count },
    { label: t.operable, count: auditData.operable_count },
    { label: t.understandable, count: auditData.understandable_count },
    { label: t.robust, count: auditData.robust_count },
  ];

  return principles.map(p => new Paragraph({
    text: `• ${p.label}: ${p.count}`,
    spacing: { after: 60 },
  }));
}

function createIssuesList(
  issues: ReportIssue[],
  t: typeof TRANSLATIONS["sv-SE"],
  config: ReportConfig
): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const templateConfig = TEMPLATE_CONFIGS[config.template];

  issues.forEach((issue, index) => {
    // Issue number and title
    paragraphs.push(new Paragraph({
      text: `${index + 1}. ${issue.success_criterion_name || issue.description.substring(0, 100)}`,
      heading: templateConfig.minimal ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_2,
      spacing: { before: templateConfig.minimal ? 120 : 200, after: 100 },
    }));

    // ETU Swedish template: Show category/principle prominently
    if (config.template === "etu-swedish") {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({ text: `${t.category} `, bold: true }),
          new TextRun({ text: issue.wcag_principle }),
        ],
        spacing: { after: 60 },
      }));
    }

    // WCAG criterion
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({ text: `${t.wcagCriterion} `, bold: true }),
        new TextRun({ text: issue.success_criterion }),
      ],
      spacing: { after: 60 },
    }));

    // ETU Swedish: EN 301 549 and Webbriktlinjer
    if (config.template === "etu-swedish") {
      if (issue.en_301_549_ref) {
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({ text: `${t.en301549} `, bold: true }),
            new TextRun({ text: issue.en_301_549_ref }),
          ],
          spacing: { after: 60 },
        }));
      }
      if (issue.webbriktlinjer_url) {
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({ text: `${t.webbriktlinjer} `, bold: true }),
            new TextRun({ text: issue.webbriktlinjer_url }),
          ],
          spacing: { after: 60 },
        }));
      }
    }

    // ETU Swedish: WCAG Explanation
    if (config.template === "etu-swedish" && issue.wcag_explanation) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: t.wcagExplanation, bold: true })],
        spacing: { before: 120, after: 60 },
      }));
      paragraphs.push(new Paragraph({
        text: issue.wcag_explanation,
        spacing: { after: 120 },
      }));
    }

    // Severity (for non-ETU templates, ETU uses priority instead)
    if (config.template !== "etu-swedish") {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({ text: `${t.severity} `, bold: true }),
          new TextRun({ 
            text: issue.severity,
            color: getSeverityColor(issue.severity)
          }),
        ],
        spacing: { after: 60 },
      }));
    }

    // Description (labeled differently for ETU)
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: config.template === "etu-swedish" ? "Beskrivning av felet" : t.description, bold: true })],
      spacing: { before: 120, after: 60 },
    }));
    paragraphs.push(new Paragraph({
      text: issue.description,
      spacing: { after: 120 },
    }));

    // Screenshot (if available - ETU Swedish shows this prominently)
    if (config.template === "etu-swedish" && issue.screenshot_url) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: "Skärmdump:", bold: true })],
        spacing: { after: 60 },
      }));
      paragraphs.push(new Paragraph({
        text: `[Bild: ${issue.screenshot_url}]`,
        spacing: { after: 120 },
        run: { italics: true, color: "666666" }
      }));
    }

    // ETU Swedish: How to Reproduce
    if (config.template === "etu-swedish" && issue.how_to_reproduce) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: t.howToReproduce, bold: true })],
        spacing: { before: 120, after: 60 },
      }));
      paragraphs.push(new Paragraph({
        text: issue.how_to_reproduce,
        spacing: { after: 120 },
      }));
    }

    // ETU Swedish: User Impact
    if (config.template === "etu-swedish" && issue.user_impact) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: t.userImpact, bold: true })],
        spacing: { before: 120, after: 60 },
      }));
      paragraphs.push(new Paragraph({
        text: issue.user_impact,
        spacing: { after: 120 },
      }));
    }

    // Template-specific: Code examples for simple template
    if (templateConfig.includeCodeExamples && issue.element_snippet) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: t.beforeFix, bold: true })],
        spacing: { after: 60 },
      }));
      paragraphs.push(new Paragraph({
        text: issue.element_snippet,
        spacing: { after: 80 },
        run: { font: "Consolas", size: 20 }
      }));
      
      // After fix example (generated from remediation)
      if (issue.remediation) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: t.afterFix, bold: true })],
          spacing: { after: 60 },
        }));
        paragraphs.push(new Paragraph({
          text: "<!-- Fixed version based on remediation -->",
          spacing: { after: 120 },
          run: { font: "Consolas", size: 20, color: "008000" }
        }));
      }
    }

    // Template-specific: DOM path for technical template
    if (templateConfig.includeDOM && issue.element_selector) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: t.domPath, bold: true })],
        spacing: { after: 60 },
      }));
      paragraphs.push(new Paragraph({
        text: issue.element_selector,
        spacing: { after: 120 },
        run: { font: "Courier New", size: 20 }
      }));
    }

    // Template-specific: Implementation details for technical template
    if (templateConfig.includeImplementation) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: t.implementationDetails, bold: true })],
        spacing: { after: 60 },
      }));
      paragraphs.push(new Paragraph({
        text: `Source: ${issue.detection_source}\nContext: ${issue.element_context || 'N/A'}`,
        spacing: { after: 120 },
        run: { font: "Courier New", size: 18 }
      }));
    }

    // Remediation (ETU Swedish shows priority, others show standard remediation)
    if (config.template === "etu-swedish") {
      // ETU format: Åtgärda with priority prefix (MÅSTE/BÖR/KAN)
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: t.fixPriority, bold: true })],
        spacing: { before: 120, after: 60 },
      }));
      const priorityPrefix = issue.fix_priority || "BÖR";
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({ text: `${priorityPrefix}  `, bold: true, color: priorityPrefix === "MÅSTE" ? "DC143C" : priorityPrefix === "BÖR" ? "FFA500" : "4CAF50" }),
          new TextRun({ text: issue.remediation })
        ],
        spacing: { after: 120 },
      }));
    } else if (!templateConfig.includeCodeExamples) {
      // Standard format
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: t.remediation, bold: true })],
        spacing: { after: 60 },
      }));
      paragraphs.push(new Paragraph({
        text: issue.remediation,
        spacing: { after: 120 },
      }));
    }

    // ETU Swedish: Related Criteria
    if (config.template === "etu-swedish" && issue.wcag_reference_url) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: t.relatedCriteria, bold: true })],
        spacing: { before: 120, after: 60 },
      }));
      paragraphs.push(new Paragraph({
        text: `WCAG 2.1: ${issue.success_criterion}, EN 301 549: ${issue.en_301_549_ref || 'N/A'}`,
        spacing: { after: 200 },
      }));
    }

    // Element (if present and not already shown in code examples)
    if (issue.element_snippet && !templateConfig.includeCodeExamples) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: t.element, bold: true })],
        spacing: { after: 60 },
      }));
      paragraphs.push(new Paragraph({
        text: issue.element_snippet,
        spacing: { after: 200 },
        run: {
          font: "Courier New",
          size: 20,
        }
      }));
    }
  });

  return paragraphs;
}

function createComplianceTable(
  auditData: AuditData,
  t: typeof TRANSLATIONS["sv-SE"]
): Table {
  const total = auditData.total_issues;
  const criticalAndSerious = auditData.issues.filter(
    i => i.severity === 'critical' || i.severity === 'serious'
  ).length;

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: t.perceivable })] }),
          new TableCell({ children: [new Paragraph({ text: auditData.perceivable_count.toString() })] }),
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: t.operable })] }),
          new TableCell({ children: [new Paragraph({ text: auditData.operable_count.toString() })] }),
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: t.understandable })] }),
          new TableCell({ children: [new Paragraph({ text: auditData.understandable_count.toString() })] }),
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: t.robust })] }),
          new TableCell({ children: [new Paragraph({ text: auditData.robust_count.toString() })] }),
        ]
      }),
    ]
  });
}

function getSeverityColor(severity: string): string {
  const colors = {
    critical: "DC143C",  // Crimson
    serious: "FF6347",   // Tomato
    moderate: "FFA500",  // Orange
    minor: "FFD700",     // Gold
  };
  return colors[severity as keyof typeof colors] || "000000";
}

/**
 * Generate HTML report
 */
export function generateHTMLReport(
  auditData: AuditData,
  config: ReportConfig
): string {
  const t = TRANSLATIONS[config.locale];
  const templateConfig = TEMPLATE_CONFIGS[config.template];
  const date = new Date(auditData.created_at).toLocaleDateString(config.locale);
  
  // Template-specific CSS
  const primaryColor = templateConfig.colors.primary;
  const secondaryColor = templateConfig.colors.secondary;
  const fontFamily = templateConfig.font;

  let html = `<!DOCTYPE html>
<html lang="${config.locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.reportTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: ${fontFamily}, sans-serif; 
      line-height: 1.6; 
      max-width: ${templateConfig.minimal ? '800px' : '1000px'}; 
      margin: 0 auto; 
      padding: 2rem; 
      background: #f5f5f5;
    }
    .container { 
      background: white; 
      padding: ${templateConfig.minimal ? '1.5rem' : '3rem'}; 
      border-radius: 8px; 
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 { 
      color: ${primaryColor}; 
      font-size: ${templateConfig.minimal ? '2rem' : '2.5rem'}; 
      margin-bottom: 1rem; 
      text-align: center;
    }
    h2 { 
      color: ${secondaryColor}; 
      font-size: ${templateConfig.minimal ? '1.3rem' : '1.8rem'}; 
      margin: 2rem 0 1rem; 
      padding-bottom: 0.5rem; 
      border-bottom: 2px solid ${primaryColor};
    }
    h3 { 
      color: ${secondaryColor}; 
      font-size: 1.2rem; 
      margin: 1.5rem 0 0.75rem;
    }
    .subtitle { 
      text-align: center; 
      color: ${secondaryColor}; 
      font-size: 1.2rem; 
      margin-bottom: 2rem;
    }
    .metadata {
      background: #f9f9f9;
      padding: 1.5rem;
      border-radius: 5px;
      margin: 2rem 0;
      border-left: 4px solid ${primaryColor};
    }
    .metadata-row {
      display: flex;
      padding: 0.5rem 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .metadata-row:last-child { border-bottom: none; }
    .metadata-label {
      font-weight: bold;
      min-width: 150px;
      color: ${primaryColor};
    }
    .overview {
      background: linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15);
      padding: 1.5rem;
      border-radius: 5px;
      margin: 2rem 0;
    }
    .principle-breakdown {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin: 1rem 0;
    }
    .principle-card {
      background: white;
      padding: 1rem;
      border-radius: 5px;
      text-align: center;
      border: 2px solid ${secondaryColor};
    }
    .principle-count {
      font-size: 2rem;
      font-weight: bold;
      color: ${primaryColor};
    }
    .issue {
      background: #fff;
      border: 1px solid #e0e0e0;
      border-left: 4px solid ${primaryColor};
      padding: ${templateConfig.minimal ? '1rem' : '1.5rem'};
      margin: 1.5rem 0;
      border-radius: 5px;
    }
    .issue-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .issue-title {
      flex: 1;
      font-size: 1.1rem;
      font-weight: bold;
      color: #333;
    }
    .severity-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.875rem;
      font-weight: bold;
      text-transform: uppercase;
    }
    .severity-critical { background: #DC143C; color: white; }
    .severity-serious { background: #FF6347; color: white; }
    .severity-moderate { background: #FFA500; color: white; }
    .severity-minor { background: #FFD700; color: #333; }
    .issue-meta {
      font-size: 0.9rem;
      color: #666;
      margin: 0.5rem 0;
    }
    .issue-section {
      margin: 1rem 0;
    }
    .issue-section-title {
      font-weight: bold;
      color: ${primaryColor};
      margin-bottom: 0.5rem;
    }
    code, pre {
      background: #f4f4f4;
      padding: ${templateConfig.minimal ? '0.5rem' : '1rem'};
      border-radius: 4px;
      font-family: ${templateConfig.includeDOM ? 'Courier New' : 'Consolas'}, monospace;
      font-size: 0.9rem;
      overflow-x: auto;
      display: block;
      margin: 0.5rem 0;
    }
    .code-example {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 1rem;
      border-radius: 5px;
      margin: 1rem 0;
    }
    .code-before { border-left: 4px solid #DC143C; }
    .code-after { border-left: 4px solid #4CAF50; }
    .scorecard {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin: 2rem 0;
    }
    .scorecard-item {
      background: linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}10);
      padding: 1.5rem;
      border-radius: 5px;
      text-align: center;
    }
    .scorecard-label {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 0.5rem;
    }
    .scorecard-value {
      font-size: 2rem;
      font-weight: bold;
      color: ${primaryColor};
    }
    footer {
      text-align: center;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 2px solid #e0e0e0;
      color: #666;
      font-size: 0.9rem;
    }
    @media print {
      body { background: white; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${t.reportTitle}</h1>
    <div class="subtitle">${config.template === "vpat-us" ? "Section 508 Compliance Report - WCAG 2.2 AA" : config.template === "simple" ? "Quick Accessibility Check" : config.template === "technical" ? "Technical Accessibility Analysis" : t.subtitle}</div>
    
    <div class="metadata">
      <div class="metadata-row">
        <span class="metadata-label">${t.auditedSource}</span>
        <span>${escapeHtml(auditData.url || "HTML Input")}</span>
      </div>
      <div class="metadata-row">
        <span class="metadata-label">${t.auditDate}</span>
        <span>${date}</span>
      </div>
      <div class="metadata-row">
        <span class="metadata-label">${t.inputType}</span>
        <span>${auditData.input_type}</span>
      </div>
      <div class="metadata-row">
        <span class="metadata-label">${t.totalIssues}</span>
        <span><strong>${auditData.total_issues}</strong></span>
      </div>
      ${templateConfig.includeVPATFormat ? `
      <div class="metadata-row">
        <span class="metadata-label">${t.conformanceLevel}</span>
        <span>WCAG 2.2 Level AA</span>
      </div>
      ` : ''}
    </div>`;

  // Executive Summary (if provided and not minimal template)
  if (config.executive_summary && !templateConfig.minimal) {
    html += `
    <section>
      <h2>${t.executiveSummary}</h2>
      <p>${escapeHtml(config.executive_summary)}</p>
    </section>`;
  }

  // Overview (not for minimal template)
  if (!templateConfig.minimal) {
    html += `
    <section class="overview">
      <h2>${t.overview}</h2>
      <p>${t.overviewIntro(auditData.total_issues)}</p>
      <div class="principle-breakdown">
        <div class="principle-card">
          <div class="principle-count">${auditData.perceivable_count}</div>
          <div>${t.perceivable}</div>
        </div>
        <div class="principle-card">
          <div class="principle-count">${auditData.operable_count}</div>
          <div>${t.operable}</div>
        </div>
        <div class="principle-card">
          <div class="principle-count">${auditData.understandable_count}</div>
          <div>${t.understandable}</div>
        </div>
        <div class="principle-card">
          <div class="principle-count">${auditData.robust_count}</div>
          <div>${t.robust}</div>
        </div>
      </div>
    </section>`;
  }

  // Issues by principle
  const principles: Array<[string, ReportIssue['wcag_principle']]> = [
    [t.perceivable, 'Perceivable'],
    [t.operable, 'Operable'],
    [t.understandable, 'Understandable'],
    [t.robust, 'Robust'],
  ];

  principles.forEach(([label, principle]) => {
    const issues = auditData.issues.filter(i => i.wcag_principle === principle);
    if (issues.length === 0) return;

    html += `\n  <section>\n    <h2>${label}</h2>`;
    
    issues.forEach((issue, index) => {
      html += `
    <article class="issue">
      <div class="issue-header">
        <div class="issue-title">${index + 1}. ${escapeHtml(issue.success_criterion_name || issue.description.substring(0, 100))}</div>
        <span class="severity-badge severity-${issue.severity}">${issue.severity}</span>
      </div>
      <div class="issue-meta"><strong>${t.wcagCriterion}</strong> ${escapeHtml(issue.success_criterion)}</div>
      
      <div class="issue-section">
        <div class="issue-section-title">${t.description}</div>
        <p>${escapeHtml(issue.description)}</p>
      </div>`;

      // Template-specific: Code examples for simple template
      if (templateConfig.includeCodeExamples && issue.element_snippet) {
        html += `
      <div class="issue-section">
        <div class="issue-section-title">${t.beforeFix}</div>
        <pre class="code-example code-before"><code>${escapeHtml(issue.element_snippet)}</code></pre>
        <div class="issue-section-title">${t.afterFix}</div>
        <pre class="code-example code-after"><code>&lt;!-- Fixed version --&gt;\n${escapeHtml('<!-- Apply remediation: ' + issue.remediation.substring(0, 100) + '... -->')}</code></pre>
      </div>`;
      }

      // Template-specific: DOM path for technical template
      if (templateConfig.includeDOM && issue.element_selector) {
        html += `
      <div class="issue-section">
        <div class="issue-section-title">${t.domPath}</div>
        <code>${escapeHtml(issue.element_selector)}</code>
      </div>`;
      }

      // Template-specific: Implementation details for technical template
      if (templateConfig.includeImplementation) {
        html += `
      <div class="issue-section">
        <div class="issue-section-title">${t.implementationDetails}</div>
        <p><strong>Source:</strong> ${issue.detection_source}</p>
        ${issue.element_context ? `<p><strong>Context:</strong> ${escapeHtml(issue.element_context)}</p>` : ''}
      </div>`;
      }

      // Remediation (always included but placement varies)
      if (!templateConfig.includeCodeExamples) {
        html += `
      <div class="issue-section">
        <div class="issue-section-title">${t.remediation}</div>
        <p>${escapeHtml(issue.remediation)}</p>
      </div>`;
      }

      // Element snippet (if not already shown)
      if (issue.element_snippet && !templateConfig.includeCodeExamples) {
        html += `
      <div class="issue-section">
        <div class="issue-section-title">${t.element}</div>
        <pre><code>${escapeHtml(issue.element_snippet)}</code></pre>
      </div>`;
      }

      html += `\n    </article>`;
    });

    html += `\n  </section>`;
  });

  // Compliance Scorecard (not for minimal template)
  if (!templateConfig.minimal) {
    html += `
  <section>
    <h2>${t.complianceScorecard}</h2>
    <div class="scorecard">
      <div class="scorecard-item">
        <div class="scorecard-label">${t.perceivable}</div>
        <div class="scorecard-value">${auditData.perceivable_count}</div>
      </div>
      <div class="scorecard-item">
        <div class="scorecard-label">${t.operable}</div>
        <div class="scorecard-value">${auditData.operable_count}</div>
      </div>
      <div class="scorecard-item">
        <div class="scorecard-label">${t.understandable}</div>
        <div class="scorecard-value">${auditData.understandable_count}</div>
      </div>
      <div class="scorecard-item">
        <div class="scorecard-label">${t.robust}</div>
        <div class="scorecard-value">${auditData.robust_count}</div>
      </div>
    </div>
  </section>`;
  }

  html += `
  <footer>
    <p>${t.generatedBy(new Date().toLocaleDateString(config.locale))}</p>
  </footer>
  </div>
</body>
</html>`;

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate Markdown report
 */
export function generateMarkdownReport(
  auditData: AuditData,
  config: ReportConfig
): string {
  const t = TRANSLATIONS[config.locale];
  const templateConfig = TEMPLATE_CONFIGS[config.template];
  const date = new Date(auditData.created_at).toLocaleDateString(config.locale);

  let md = `# ${t.reportTitle}\n\n`;
  
  // Template-specific subtitle
  if (config.template === "vpat-us") {
    md += `## Section 508 Compliance Report - WCAG 2.2 AA\n\n`;
  } else if (config.template === "simple") {
    md += `## Quick Accessibility Check\n\n`;
  } else if (config.template === "technical") {
    md += `## Technical Accessibility Analysis\n\n`;
  } else {
    md += `## ${t.subtitle}\n\n`;
  }

  md += `**${t.auditedSource}** ${auditData.url || 'HTML Input'}  \n`;
  md += `**${t.auditDate}** ${date}  \n`;
  md += `**${t.totalIssues}** ${auditData.total_issues}\n\n`;

  if (templateConfig.includeVPATFormat) {
    md += `**${t.conformanceLevel}** WCAG 2.2 Level AA  \n\n`;
  }

  if (config.executive_summary && !templateConfig.minimal) {
    md += `## ${t.executiveSummary}\n\n${config.executive_summary}\n\n`;
  }

  if (!templateConfig.minimal) {
    md += `## ${t.overview}\n\n`;
    md += `${t.overviewIntro(auditData.total_issues)}\n\n`;
    md += `- ${t.perceivable}: ${auditData.perceivable_count}\n`;
    md += `- ${t.operable}: ${auditData.operable_count}\n`;
    md += `- ${t.understandable}: ${auditData.understandable_count}\n`;
    md += `- ${t.robust}: ${auditData.robust_count}\n\n`;
  }

  const principles: Array<[string, ReportIssue['wcag_principle']]> = [
    [t.perceivable, 'Perceivable'],
    [t.operable, 'Operable'],
    [t.understandable, 'Understandable'],
    [t.robust, 'Robust'],
  ];

  principles.forEach(([label, principle]) => {
    const issues = auditData.issues.filter(i => i.wcag_principle === principle);
    if (issues.length === 0) return;

    md += `\n## ${label}\n\n`;
    
    issues.forEach((issue, index) => {
      md += `### ${index + 1}. ${issue.success_criterion_name || issue.description.substring(0, 100)}\n\n`;
      md += `**${t.wcagCriterion}** ${issue.success_criterion}  \n`;
      md += `**${t.severity}** \`${issue.severity}\`  \n\n`;
      
      md += `**${t.description}**  \n${issue.description}\n\n`;

      // Template-specific: Code examples for simple template
      if (templateConfig.includeCodeExamples && issue.element_snippet) {
        md += `**${t.beforeFix}**  \n\`\`\`html\n${issue.element_snippet}\n\`\`\`\n\n`;
        md += `**${t.afterFix}**  \n\`\`\`html\n<!-- Fixed version -->\n<!-- ${issue.remediation.substring(0, 100)} -->\n\`\`\`\n\n`;
      }

      // Template-specific: DOM path for technical template
      if (templateConfig.includeDOM && issue.element_selector) {
        md += `**${t.domPath}**  \n\`${issue.element_selector}\`\n\n`;
      }

      // Template-specific: Implementation details for technical template
      if (templateConfig.includeImplementation) {
        md += `**${t.implementationDetails}**  \n`;
        md += `- Source: ${issue.detection_source}\n`;
        if (issue.element_context) {
          md += `- Context: ${issue.element_context}\n`;
        }
        md += `\n`;
      }

      // Remediation (always included but placement varies)
      if (!templateConfig.includeCodeExamples) {
        md += `**${t.remediation}**  \n${issue.remediation}\n\n`;
      }

      // Element snippet (if not already shown)
      if (issue.element_snippet && !templateConfig.includeCodeExamples) {
        md += `**${t.element}**  \n\`\`\`html\n${issue.element_snippet}\n\`\`\`\n\n`;
      }

      md += `---\n\n`;
    });
  });

  // Compliance Scorecard (not for minimal template)
  if (!templateConfig.minimal) {
    md += `\n## ${t.complianceScorecard}\n\n`;
    md += `| ${t.perceivable} | ${t.operable} | ${t.understandable} | ${t.robust} |\n`;
    md += `|---|---|---|---|\n`;
    md += `| ${auditData.perceivable_count} | ${auditData.operable_count} | ${auditData.understandable_count} | ${auditData.robust_count} |\n\n`;
  }

  md += `\n---\n\n${t.generatedBy(new Date().toLocaleDateString(config.locale))}\n`;

  return md;
}
