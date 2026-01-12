/**
 * MCP WCAG Docs Tool - TypeScript Implementation
 * Provides WCAG 2.2 success criteria information
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const wcagTools: Tool[] = [
  {
    name: "get_wcag_criterion",
    description: "Get detailed information about a specific WCAG 2.2 success criterion (e.g., '1.1.1', '2.4.1')",
    inputSchema: {
      type: "object",
      properties: {
        criterion_id: {
          type: "string",
          description: "The WCAG success criterion ID (e.g., '1.1.1', '1.4.3', '2.1.1')"
        }
      },
      required: ["criterion_id"]
    }
  },
  {
    name: "search_wcag_by_principle",
    description: "Search WCAG criteria by principle (Perceivable, Operable, Understandable, Robust)",
    inputSchema: {
      type: "object",
      properties: {
        principle: {
          type: "string",
          description: "The WCAG principle to search",
          enum: ["Perceivable", "Operable", "Understandable", "Robust"]
        },
        level: {
          type: "string",
          description: "Filter by conformance level (optional)",
          enum: ["A", "AA", "AAA"]
        }
      },
      required: ["principle"]
    }
  },
  {
    name: "get_all_criteria",
    description: "Get a list of all WCAG 2.2 success criteria with basic info",
    inputSchema: {
      type: "object",
      properties: {
        level: {
          type: "string",
          description: "Filter by conformance level (optional)",
          enum: ["A", "AA", "AAA"]
        }
      }
    }
  }
];

// WCAG 2.2 Success Criteria Database
interface WCAGCriterion {
  num1.1": {
    num: "1.1.1",
    title: "Non-text Content",
    level: "A",
    principle: "Perceivable",
    guideline: "1.1 Text Alternatives",
    description: "All non-text content that is presented to the user has a text alternative that serves the equivalent purpose.",
    understanding_url: "https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html",
    how_to_meet_url: "https://www.w3.org/WAI/WCAG22/quickref/#non-text-content",
    en_301_549: "9.1.1.1",
    examples: [
      "Images have alt text that describes their content or function",
      "Form inputs have associated labels",
      "Icons have accessible names",
      "Decorative images have empty alt attributes"
    ]
  },
  "1.3.1": {
    num: "1.3.1",
    title: "Info and Relationships",
    level: "A",
    principle: "Perceivable",
    guideline: "1.3 Adaptable",
    description: "Information, structure, and relationships conveyed through presentation can be programmatically determined or are available in text.",
    understanding_url: "https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html",
    how_to_meet_url: "https://www.w3.org/WAI/WCAG22/quickref/#info-and-relationships",
    en_301_549: "9.1.3.1",
    examples: [
      "Headings are marked up with <h1>-<h6> elements",
      "Lists use <ul>, <ol>, or <dl> elements",
      "Data tables use proper table markup with <th> headers",
      "Form labels are associated with inputs using <label> or aria-labelledby"
    ]
  },
  "1.4.3": {
    num: "1.4.3",
    title: "Contrast (Minimum)",
    level: "AA",
    principle: "Perceivable",
    guideline: "1.4 Distinguishable",
    description: "The visual presentation of text and images of text has a contrast ratio of at least 4.5:1, except for large text (at least 18 point or 14 point bold) which requires at least 3:1.",
    understanding_url: "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html",
    how_to_meet_url: "https://www.w3.org/WAI/WCAG22/quickref/#contrast-minimum",
    en_301_549: "9.1.4.3",
    examples: [
      "Normal text has 4.5:1 contrast ratio",
      "Large text (18pt+) has 3:1 contrast ratio",
      "Use color contrast tools to verify ratios"
    ]
}

const wcagData: Record<string, WCAGCriterion> = {
  "1.4.3": {
    num: "1.4.3",
    title: "Contrast (Minimum)",
    level: "AA",
    principle: "Perceivable",
    guideline: "1.4 Distinguishable",
    description: "The visual presentation of text and images of text has a contrast ratio of at least 4.5:1, except for large text (at least 18 point or 14 point bold) which requires at least 3:1.",
    understanding_url: "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html",
    how_to_meet_url: "https://www.w3.org/WAI/WCAG22/quickref/#contrast-minimum",
    en_301_549: "9.1.4.3"
  },
  "2.4.4": {
    num: "2.4.4",
    title: "Link Purpose (In Context)",
    level: "A",
    principle: "Operable",
    guideline: "2.4 Navigable",
    description: "The purpose of each link can be determined from the link text alone or from the link text together with its programmatically determined link context.",
    understanding_url: "https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html",
    how_to_meet_url: "https://www.w3.org/WAI/WCAG22/quickref/#link-purpose-in-context",
    en_301_549: "9.2.4.4"
  },
  "1.3.1": {
    num: "1.3.1",
    title: "Info and Relationships",
    level: "A",
    principle: "Perceivable",
    guideline: "1.3 Adaptable",
    description: "Information, structure, and relationships conveyed through presentation can be programmatically determined or are available in text.",
    understanding_url: "https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html",
    how_to_meet_url: "https://www.w3.org/WAI/WCAG22/quickref/#info-and-relationships",
    en_301_549: "9.1.3.1"
  },
  "2.1.1": {
    num: "2.1.1",
    title: "Keyboard",
    level: "A",
    principle: "Operable",
    guideline: "2.1 Keyboard Accessible",
    description: "All functionality of the content is operable through a keyboard interface without requiring specific timings for individual keystrokes.",
    understanding_url: "https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html",
    how_to_meet_url: "https://www.w3.org/WAI/WCAG22/quickref/#keyboard",
    en_301_549: "9.2.1.1"
  },
  "2.4.7": {
    num: "2.4.7",
    title: "Focus Visible",
    level: "AA",
    principle: "Operable",
    guideline: "2.4 Navigable",
    description: "Any keyboard operable user interface has a mode of operation where the keyboard focus indicator is visible.",
    understanding_url: "https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html",
    how_to_meet_url: "https://www.w3.org/WAI/WCAG22/quickref/#focus-visible",
    en_301_549: "9._id = args.criterion_id || args.criterion;
    
    const data = wcagData[criterion_id];
    
    if (!data) {
      // Return generic info for unknown criteria
      const level: "A" | "AA" | "AAA" = criterion_id.startsWith("1.") ? "A" : criterion_id.startsWith("2.") ? "A" : "AA";
      const principle: "Perceivable" | "Operable" | "Understandable" | "Robust" = 
        criterion_id.startsWith("1.") ? "Perceivable" : 
        criterion_id.startsWith("2.") ? "Operable" : 
        criterion_id.startsWith("3.") ? "Understandable" : "Robust";
      
      return {
        num: criterion_id,
        title: `WCAG ${criterion_id}`,
        level,
        principle,
        description: `WCAG Success Criterion ${criterion_id} - not in database. Visit understanding URL for details.`,
        understanding_url: `https://www.w3.org/WAI/WCAG22/Understanding/${criterion_id.replace(/\./g, '-')}.html`,
        how_to_meet_url: `https://www.w3.org/WAI/WCAG22/quickref/#${criterion_id.replace(/\./g, '-')}`,
        en_301_549: `9.${criterion_id}`,
        note: "This is a limited database. Only common criteria have full details."
      };
    }
    
    // Format criterion with examples
    let result = `WCAG ${data.num}: ${data.title} (Level ${data.level})\n\n`;
    result += `Principle: ${data.principle}\n`;
    result += `Guideline: ${data.guideline}\n\n`;
    result += `Description:\n${data.description}\n\n`;
    
    if (data.examples && data.examples.length > 0) {
      result += `Examples:\n${data.examples.map(ex => `- ${ex}`).join('\n')}\n\n`;
    }
    
    result += `Resources:\n`;
    result += `- Understanding: ${data.understanding_url}\n`;
    result += `- How to Meet: ${data.how_to_meet_url}\n`;
    result += `- EN 301 549: ${data.en_301_549}\n`;
    
    return { text: result, data };
  }
  
  if (name === "search_wcag_by_principle") {
    const { principle, level } = args;
    
    const matches = Object.entries(wcagData).filter(([_, criterion]) => {
      return criterion.principle === principle && (!level || criterion.level === level);
    });
    
    if (matches.length === 0) {
      return {
        principle,
        level: level || "all",
        matches: [],
        message: `No criteria found for principle '${principle}'${level ? ` at level ${level}` : ''}`
      };
    }
    
    let result = `WCAG Criteria for ${principle}${level ? ` (Level ${level})` : ''}:\n\n`;
    matches.forEach(([id, criterion]) => {
      result += `${id}: ${criterion.title} (Level ${criterion.level})\n`;
      result += `  ${criterion.description.substring(0, 100)}...\n\n`;
    });
    
    return {
      principle,
      level: level || "all",
      count: matches.length,
      text: result,
      criteria: matches.map(([id, criterion]) => ({
        id,
        title: criterion.title,
        level: criterion.level
      }))
    };
  }
  
  if (name === "get_all_criteria") {
    const { level } = args;
    
    const criteria = Object.entries(wcagData).filter(([_, criterion]) => {
      return !level || criterion.level === level;
    });
    
    let result = `WCAG 2.2 Success Criteria${level ? ` (Level ${level})` : ''}:\n\n`;
    criteria.forEach(([id, criterion]) => {
      result += `${id}: ${criterion.title} (Level ${criterion.level}) - ${criterion.principle}\n`;
    });
    
    return {
      level: level || "all",
      count: criteria.length,
      text: result,
      criteria: criteria.map(([id, criterion]) => ({
        id,
        title: criterion.title,
        level: criterion.level,
        principle: criterion.principle
      }))
    }
  "4.1.1": {
    num: "4.1.1",
    title: "Parsing",
    level: "A",
    principle: "Robust",
    guideline: "4.1 Compatible",
    description: "In content implemented using markup languages, elements have complete start and end tags, elements are nested according to their specifications, elements do not contain duplicate attributes, and any IDs are unique.",
    understanding_url: "https://www.w3.org/WAI/WCAG22/Understanding/parsing.html",
    how_to_meet_url: "https://www.w3.org/WAI/WCAG22/quickref/#parsing",
    en_301_549: "9.4.1.1"
  }
};

export async function handleWcagTool(name: string, args: any): Promise<any> {
  if (name === "get_wcag_criterion") {
    const criterion = args.criterion;
    
    const data = wcagData[criterion];
    
    if (!data) {
      // Return generic info for unknown criteria
      const level = criterion.startsWith("1.") ? "A" : criterion.startsWith("2.") ? "A" : "AA";
      const principle = criterion.startsWith("1.") ? "Perceivable" : 
                       criterion.startsWith("2.") ? "Operable" : 
                       criterion.startsWith("3.") ? "Understandable" : "Robust";
      
      return {
        num: criterion,
        title: `WCAG ${criterion}`,
        level,
        principle,
        description: `WCAG Success Criterion ${criterion}`,
        understanding_url: `https://www.w3.org/WAI/WCAG22/Understanding/${criterion.replace(/\./g, '')}.html`,
        how_to_meet_url: `https://www.w3.org/WAI/WCAG22/quickref/#${criterion.replace(/\./g, '')}`,
        en_301_549: `9.${criterion}`
      };
    }
    
    return data;
  }
  
  throw new Error(`Unknown WCAG tool: ${name}`);
}
