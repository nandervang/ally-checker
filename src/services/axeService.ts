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
    impact: violation.help,
    remediation: firstNode?.failureSummary || "Review and fix the accessibility issue according to WCAG guidelines.",
    helpUrl: violation.helpUrl,
    occurrences: violation.nodes.length,
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
