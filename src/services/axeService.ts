/**
 * Axe-core integration service for automated WCAG 2.2 AA accessibility testing
 * Maps axe violations to our AuditIssue format with WCAG categorization
 */

import axe, { type Result } from "axe-core";
import type { AuditIssue, AuditResult } from "@/data/mockAuditResults";

// Map axe impact levels to our severity levels
const impactToSeverity = {
  critical: "critical" as const,
  serious: "serious" as const,
  moderate: "moderate" as const,
  minor: "minor" as const,
};

// Map WCAG tags to WCAG principles
const wcagToPrinciple = (tags: string[]): AuditIssue["principle"] => {
  // Check for WCAG 2 principle tags
  if (tags.some((tag) => tag.includes("cat.text-alternatives") || tag.includes("cat.time-based-media"))) {
    return "perceivable";
  }
  if (tags.some((tag) => tag.includes("cat.keyboard") || tag.includes("cat.seizure") || tag.includes("cat.navigation"))) {
    return "operable";
  }
  if (tags.some((tag) => tag.includes("cat.language") || tag.includes("cat.predictable") || tag.includes("cat.input-assistance"))) {
    return "understandable";
  }
  if (tags.some((tag) => tag.includes("cat.parsing") || tag.includes("cat.name-role-value"))) {
    return "robust";
  }
  
  // Default to perceivable if no clear match
  return "perceivable";
};

// Extract WCAG level from tags
const extractWcagLevel = (tags: string[]): "A" | "AA" | "AAA" => {
  if (tags.some((tag) => tag.includes("wcag2aaa") || tag.includes("wcag2.2aaa") || tag.includes("wcag21aaa"))) {
    return "AAA";
  }
  if (tags.some((tag) => tag.includes("wcag2aa") || tag.includes("wcag2.2aa") || tag.includes("wcag21aa"))) {
    return "AA";
  }
  return "A";
};

// Extract WCAG guideline reference from tags
const extractGuideline = (tags: string[]): string => {
  const wcagTag = tags.find((tag) => tag.match(/wcag\d{3,4}/i));
  if (wcagTag) {
    const match = wcagTag.match(/wcag(\d)(\d)(\d)(\d?)/i);
    if (match) {
      const [, major = "", minor = "", patch = "", subpatch = ""] = match;
      return subpatch 
        ? `WCAG ${major}.${minor}.${patch}.${subpatch}`
        : `WCAG ${major}.${minor}.${patch}`;
    }
  }
  return "WCAG 2.2";
};

// Helper function to generate user impact description
const generateUserImpact = (violationId: string, severity: string): string => {
  const impactMap: Record<string, string> = {
    'image-alt': 'Screen reader users cannot understand image content. They will only hear "image" or the filename without meaningful information.',
    'color-contrast': 'Users with low vision, color blindness, or viewing in bright sunlight cannot read the text clearly.',
    'button-name': 'Screen reader users cannot identify the button\'s purpose, making it impossible to understand what will happen when activated.',
    'link-name': 'Screen reader users cannot identify where the link leads, preventing informed navigation decisions.',
    'label': 'Screen reader users cannot identify the purpose of form fields, leading to errors and confusion.',
    'input-button-name': 'Screen reader users cannot identify what the button does, preventing effective form interaction.',
    'html-has-lang': 'Screen readers cannot determine correct pronunciation and voice, resulting in garbled or incomprehensible speech output.',
    'valid-lang': 'Screen readers may use incorrect pronunciation, making content difficult or impossible to understand.',
    'document-title': 'Screen reader users and users navigating browser tabs cannot identify the page content or purpose.',
    'landmark-one-main': 'Screen reader users cannot quickly navigate to the main content, forcing them to tab through all navigation elements.',
    'region': 'Screen reader users cannot efficiently navigate page sections, making it difficult to find and access content.',
    'page-has-heading-one': 'Screen reader users may not understand the page hierarchy and main topic.',
    'heading-order': 'Screen reader users may be confused by the document structure and unable to navigate efficiently.',
    'list': 'Screen reader users may not understand that items are part of a group, losing important context.',
    'listitem': 'Screen reader users may not understand the relationship between list items and their parent list.',
    'meta-viewport': 'Users with low vision cannot zoom the page to read content, preventing access for users who need magnification.',
    'tabindex': 'Keyboard users may encounter unexpected focus order, making navigation confusing or impossible.',
    'aria-*': 'Screen reader users may receive incorrect information about the element\'s role, state, or properties.',
    'table': 'Screen reader users cannot understand table relationships, making complex data incomprehensible.',
  };

  // Find matching pattern
  for (const [pattern, impact] of Object.entries(impactMap)) {
    if (violationId.includes(pattern) || pattern.includes(violationId)) {
      return impact;
    }
  }

  // Default impact based on severity
  if (severity === 'critical') {
    return 'This issue prevents users with disabilities from accessing essential content or functionality.';
  } else if (severity === 'serious') {
    return 'This issue creates significant barriers for users with disabilities, making content difficult to access.';
  } else if (severity === 'moderate') {
    return 'This issue makes content less accessible for users with disabilities, though workarounds may exist.';
  }
  return 'This issue may cause inconvenience for some users with disabilities.';
};

// Helper function to generate code example fix
const generateCodeExample = (violationId: string, element: string): string | undefined => {
  const fixes: Record<string, (html: string) => string> = {
    'image-alt': (html) => {
      if (html.includes('alt=')) return undefined; // Already has alt
      return html.replace(/<img([^>]*?)>/i, '<img$1 alt="Descriptive text">');
    },
    'button-name': (html) => {
      if (html.includes('<button></button>')) {
        return '<button>Click me</button>';
      }
      if (html.includes('aria-label')) return undefined;
      return html.replace(/<button([^>]*?)>/i, '<button$1 aria-label="Descriptive label">');
    },
    'link-name': (html) => {
      if (html.includes('</a>') && !html.includes('>  <')) {
        return html; // Has text content
      }
      return html.replace(/<a([^>]*?)>([^<]*)<\/a>/i, '<a$1>Descriptive link text</a>');
    },
    'label': (html) => {
      const id = (html.match(/id="([^"]+)"/) || [])[1] || 'input-id';
      return `<label for="${id}">Field label</label>\\n${html.includes('id=') ? html : html.replace(/<input/i, `<input id="${id}"`)}`;
    },
    'html-has-lang': () => '<html lang="en">',
    'valid-lang': (html) => html.replace(/lang="[^"]*"/i, 'lang="en"'),
    'document-title': () => '<title>Page Title</title>',
    'color-contrast': (html) => {
      if (html.includes('color:')) {
        return html.replace(/color:\s*#[0-9a-f]{6}/i, 'color: #000');
      }
      return html.replace(/<([a-z]+)([^>]*?)>/i, '<$1$2 style="color: #000">');
    },
  };

  for (const [pattern, fixFn] of Object.entries(fixes)) {
    if (violationId.includes(pattern)) {
      try {
        return fixFn(element);
      } catch {
        return undefined;
      }
    }
  }

  return undefined;
};

// Convert axe violation to our AuditIssue format
const convertAxeViolation = (violation: Result, index: number): AuditIssue => {
  const principle = wcagToPrinciple(violation.tags);
  const wcagLevel = extractWcagLevel(violation.tags);
  const guideline = extractGuideline(violation.tags);
  const severity = violation.impact ? (impactToSeverity[violation.impact] ?? "moderate") : "moderate";

  // Get the first node for element details
  const firstNode = violation.nodes[0];
  const element = firstNode?.html || "<unknown>";
  const selector = firstNode?.target.join(" > ") || "unknown";

  // Generate user impact and code example
  const userImpact = generateUserImpact(violation.id, severity);
  const codeExample = generateCodeExample(violation.id, element);

  return {
    id: `axe-${violation.id}-${String(index)}`,
    principle,
    guideline,
    wcagLevel,
    severity,
    title: violation.help,
    description: violation.description,
    element,
    selector,
    impact: userImpact,
    remediation: firstNode?.failureSummary || "Review and fix the accessibility issue according to WCAG guidelines.",
    helpUrl: violation.helpUrl,
    occurrences: violation.nodes.length,
    codeExample,
  };
};

/**
 * Run axe-core analysis on HTML content
 * @param html HTML string to analyze
 * @param context Optional context (URL or filename) for reporting
 * @returns Promise<AuditResult> with categorized issues
 */
export async function runAxeAnalysis(
  html: string,
  context?: { url?: string; fileName?: string; documentType?: "html" | "pdf" | "docx" }
): Promise<AuditResult> {
  // Create a temporary iframe to run axe in
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  try {
    // Write HTML to iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error("Could not access iframe document");
    }
    
    // Use safer alternative to document.write
    iframeDoc.open();
    iframeDoc.documentElement.innerHTML = html;
    iframeDoc.close();

    // Wait for document to be ready
    await new Promise<void>((resolve) => {
      if (iframeDoc.readyState === "complete") {
        resolve();
      } else {
        iframe.onload = () => { resolve(); };
      }
    });

    // Run axe analysis with WCAG 2.2 AA rules
    const results = await axe.run(iframeDoc, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
    });

    // Convert violations to our format
    const issues = results.violations.map((violation, index) => 
      convertAxeViolation(violation, index)
    );

    // Calculate summary statistics
    const summary = {
      totalIssues: issues.length,
      critical: issues.filter((i) => i.severity === "critical").length,
      serious: issues.filter((i) => i.severity === "serious").length,
      moderate: issues.filter((i) => i.severity === "moderate").length,
      minor: issues.filter((i) => i.severity === "minor").length,
      passed: results.passes.length,
      failed: results.violations.length,
    };

    return {
      url: context?.url,
      fileName: context?.fileName,
      documentType: context?.documentType || "html",
      timestamp: new Date().toISOString(),
      summary,
      issues,
    };
  } finally {
    // Clean up iframe
    document.body.removeChild(iframe);
  }
}

/**
 * Run axe-core analysis on a URL by fetching and parsing it
 * @param url URL to analyze
 * @returns Promise<AuditResult> with categorized issues
 */
export async function runAxeAnalysisOnUrl(url: string): Promise<AuditResult> {
  try {
    // Fetch the HTML content
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${String(response.status)} ${response.statusText}`);
    }
    
    const html = await response.text();
    
    return await runAxeAnalysis(html, { url, documentType: "html" });
  } catch (error) {
    throw new Error(`Failed to analyze URL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Run axe-core analysis on the current page (for snippet mode)
 * @param snippet HTML snippet to analyze
 * @returns Promise<AuditResult> with categorized issues
 */
export async function runAxeAnalysisOnSnippet(snippet: string): Promise<AuditResult> {
  // Wrap snippet in basic HTML structure
  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Snippet Analysis</title>
      </head>
      <body>
        ${snippet}
      </body>
    </html>
  `;
  
  return runAxeAnalysis(html, { documentType: "html" });
}
