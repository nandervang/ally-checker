/**
 * MCP WAI Tips Tool - TypeScript Implementation
 * Provides W3C WAI tips and resources for accessibility
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const waiTools: Tool[] = [
  {
    name: "get_wai_resource",
    description:
      "Get W3C WAI resource content (developing tips, designing tips, writing tips, ARIA patterns, Understanding docs)",
    inputSchema: {
      type: "object",
      properties: {
        resource: {
          type: "string",
          description: "Resource to fetch",
          enum: [
            "developing",
            "designing",
            "writing",
            "main",
            "understanding",
            "understanding22",
            "aria",
          ],
        },
        specific_page: {
          type: "string",
          description:
            "Optional specific page URL path (e.g., 'headings-and-labels.html' for Understanding docs)",
        },
      },
      required: ["resource"],
    },
  },
  {
    name: "search_wai_tips",
    description:
      "Search for WAI tips related to a specific accessibility concern (headings, forms, images, colors, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description:
            "Topic to search for (e.g., 'headings', 'forms', 'images', 'color contrast', 'keyboard navigation')",
        },
      },
      required: ["topic"],
    },
  },
  {
    name: "get_aria_pattern",
    description: "Get WAI-ARIA pattern documentation for interactive components",
    inputSchema: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description:
            "ARIA pattern name (e.g., 'dialog', 'tabs', 'accordion', 'menu', 'button', 'combobox')",
        },
      },
      required: ["pattern"],
    },
  },
];

const WAI_RESOURCES: Record<
  string,
  { url: string; title: string; description: string }
> = {
  developing: {
    url: "https://www.w3.org/WAI/tips/developing/",
    title: "Developing for Web Accessibility",
    description: "Tips for getting started with web accessibility development",
  },
  designing: {
    url: "https://www.w3.org/WAI/tips/designing/",
    title: "Designing for Web Accessibility",
    description: "Tips for user interface and visual design",
  },
  writing: {
    url: "https://www.w3.org/WAI/tips/writing/",
    title: "Writing for Web Accessibility",
    description: "Tips for writing and presenting content",
  },
  main: {
    url: "https://www.w3.org/WAI/",
    title: "W3C Web Accessibility Initiative",
    description:
      "Main WAI homepage with standards, guidelines, and resources",
  },
  understanding: {
    url: "https://www.w3.org/WAI/WCAG21/Understanding/",
    title: "Understanding WCAG 2.1",
    description: "Understanding documents for WCAG 2.1 success criteria",
  },
  understanding22: {
    url: "https://www.w3.org/WAI/WCAG22/Understanding/",
    title: "Understanding WCAG 2.2",
    description: "Understanding documents for WCAG 2.2 success criteria",
  },
  aria: {
    url: "https://www.w3.org/WAI/ARIA/apg/",
    title: "ARIA Authoring Practices Guide (APG)",
    description: "WAI-ARIA patterns and widgets",
  },
};

const ARIA_PATTERNS: Record<string, string> = {
  dialog: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
  modal: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
  tabs: "https://www.w3.org/WAI/ARIA/apg/patterns/tabs/",
  accordion: "https://www.w3.org/WAI/ARIA/apg/patterns/accordion/",
  menu: "https://www.w3.org/WAI/ARIA/apg/patterns/menubar/",
  button: "https://www.w3.org/WAI/ARIA/apg/patterns/button/",
  combobox: "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/",
  disclosure: "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",
  listbox: "https://www.w3.org/WAI/ARIA/apg/patterns/listbox/",
  tooltip: "https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/",
  radio: "https://www.w3.org/WAI/ARIA/apg/patterns/radio/",
  slider: "https://www.w3.org/WAI/ARIA/apg/patterns/slider/",
  spinbutton: "https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/",
  carousel: "https://www.w3.org/WAI/ARIA/apg/patterns/carousel/",
  breadcrumb: "https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/",
};

export async function handleWaiTool(
  name: string,
  args: Record<string, any>
): Promise<any> {
  if (name === "get_wai_resource") {
    const { resource, specific_page } = args;

    if (!WAI_RESOURCES[resource]) {
      return {
        error: `Unknown resource '${resource}'. Available: ${Object.keys(WAI_RESOURCES).join(", ")}`,
      };
    }

    let url = WAI_RESOURCES[resource].url;
    if (specific_page) {
      url = url.replace(/\/$/, "") + "/" + specific_page.replace(/^\//, "");
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          error: `HTTP ${response.status}: ${response.statusText}`,
          url,
        };
      }

      const html = await response.text();
      const title = specific_page
        ? `${WAI_RESOURCES[resource].title} - ${specific_page}`
        : WAI_RESOURCES[resource].title;

      // Extract main content (simplified - truncate for AI consumption)
      const preview = html.slice(0, 5000);

      return {
        title,
        url,
        description: WAI_RESOURCES[resource].description,
        content: preview,
        note: "Content truncated for brevity. Visit URL for full content.",
      };
    } catch (error: any) {
      if (error.name === "AbortError") {
        return { error: "Request timeout after 30 seconds", url };
      }
      return { error: `Failed to fetch: ${error.message}`, url };
    }
  }

  if (name === "search_wai_tips") {
    const topic = (args.topic || "").toLowerCase();
    const tips: string[] = [];

    if (topic.match(/heading|label|title/)) {
      tips.push(
        "**Developing Tip**: Provide informative, unique page titles and use headings to convey meaning and structure"
      );
      tips.push(
        "**Understanding WCAG 2.4.6 (Headings and Labels)**: https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels.html"
      );
    }

    if (topic.match(/form|input|label/)) {
      tips.push(
        "**Developing Tip**: Associate a label with every form control"
      );
      tips.push(
        "**Designing Tip**: Provide clear and consistent navigation options"
      );
      tips.push(
        "**Reference**: https://www.w3.org/WAI/tips/developing/#associate-a-label-with-every-form-control"
      );
    }

    if (topic.match(/image|alt|alternative/)) {
      tips.push("**Developing Tip**: Provide text alternatives for images");
      tips.push(
        "**Writing Tip**: Write meaningful text alternatives for images"
      );
      tips.push(
        "**Reference**: https://www.w3.org/WAI/tips/developing/#include-alternative-text-for-images"
      );
    }

    if (topic.match(/color|contrast/)) {
      tips.push(
        "**Designing Tip**: Provide sufficient contrast between foreground and background"
      );
      tips.push("**Designing Tip**: Don't use color alone to convey information");
      tips.push(
        "**WCAG 2.2 Reference**: Contrast (Minimum) 1.4.3 (Level AA) - 4.5:1 for normal text, 3:1 for large text"
      );
    }

    if (topic.match(/keyboard|navigation|focus/)) {
      tips.push(
        "**Developing Tip**: Ensure that all interactive elements are keyboard accessible"
      );
      tips.push(
        "**Developing Tip**: Provide a skip link and ensure keyboard focus is visible and clear"
      );
      tips.push(
        "**Reference**: https://www.w3.org/WAI/tips/developing/#ensure-that-all-interactive-elements-are-keyboard-accessible"
      );
    }

    if (topic.match(/aria|role|state/)) {
      tips.push(
        "**ARIA Patterns**: Use WAI-ARIA roles, states, and properties correctly"
      );
      tips.push(
        "**Reference**: https://www.w3.org/WAI/ARIA/apg/ (ARIA Authoring Practices Guide)"
      );
      tips.push(
        "**Note**: First rule of ARIA - Don't use ARIA. Use native HTML elements when possible."
      );
    }

    if (topic.match(/video|audio|media|captions/)) {
      tips.push(
        "**Developing Tip**: Provide transcripts and captions for multimedia"
      );
      tips.push(
        "**WCAG Reference**: 1.2.2 Captions (Prerecorded) - Level A"
      );
    }

    if (topic.match(/link|anchor/)) {
      tips.push(
        "**Developing Tip**: Use clear link text (avoid 'click here' or 'read more')"
      );
      tips.push(
        "**WCAG Reference**: 2.4.4 Link Purpose (In Context) - Level A"
      );
    }

    if (tips.length === 0) {
      tips.push(
        `No specific tips found for '${topic}'. Try topics like: headings, forms, images, color, keyboard, aria, media, links`
      );
      tips.push(
        "Browse all tips at:",
        "- Developing: https://www.w3.org/WAI/tips/developing/",
        "- Designing: https://www.w3.org/WAI/tips/designing/",
        "- Writing: https://www.w3.org/WAI/tips/writing/"
      );
    }

    return { tips };
  }

  if (name === "get_aria_pattern") {
    const pattern = (args.pattern || "").toLowerCase();

    if (!ARIA_PATTERNS[pattern]) {
      return {
        error: `Unknown ARIA pattern '${pattern}'. Available patterns: ${Object.keys(ARIA_PATTERNS).join(", ")}`,
        reference: "https://www.w3.org/WAI/ARIA/apg/patterns/",
      };
    }

    const url = ARIA_PATTERNS[pattern];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          pattern,
          url,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const html = await response.text();

      return {
        pattern,
        url,
        title: `WAI-ARIA ${pattern.charAt(0).toUpperCase() + pattern.slice(1)} Pattern`,
        content: html.slice(0, 5000),
        note: "Content truncated. Visit URL for full pattern documentation, keyboard interaction, and code examples.",
      };
    } catch (error: any) {
      if (error.name === "AbortError") {
        return { pattern, url, error: "Request timeout after 30 seconds" };
      }
      return { pattern, url, error: `Failed to fetch: ${error.message}` };
    }
  }

  return { error: `Unknown WAI tool: ${name}` };
}
