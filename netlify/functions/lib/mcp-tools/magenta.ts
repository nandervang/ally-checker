/**
 * MCP Magenta A11y Tool - TypeScript Implementation
 * Provides Magenta A11y component testing patterns and checklists
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const magentaTools: Tool[] = [
  {
    name: "get_magenta_component",
    description:
      "Get Magenta A11y testing checklist for a specific component (button, form, dialog, tabs, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        component: {
          type: "string",
          description: "Component name",
          enum: [
            "button",
            "checkbox",
            "radio",
            "link",
            "form",
            "text-input",
            "select",
            "heading",
            "image",
            "table",
            "dialog",
            "menu",
            "tabs",
            "accordion",
            "carousel",
            "tooltip",
          ],
        },
      },
      required: ["component"],
    },
  },
  {
    name: "search_magenta_patterns",
    description:
      "Search Magenta A11y for components matching a description or category",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Search query (e.g., 'forms', 'interactive', 'navigation')",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_magenta_testing_methods",
    description:
      "Get general testing methods from Magenta A11y (keyboard, screen reader, visual)",
    inputSchema: {
      type: "object",
      properties: {
        method: {
          type: "string",
          description: "Testing method",
          enum: ["keyboard", "screen-reader", "visual", "all"],
        },
      },
      required: ["method"],
    },
  },
];

const MAGENTA_COMPONENTS: Record<
  string,
  { url: string; category: string; description: string }
> = {
  button: {
    url: "https://www.magentaa11y.com/checklist-web/button/",
    category: "Interactive",
    description: "Button component accessibility testing",
  },
  checkbox: {
    url: "https://www.magentaa11y.com/checklist-web/checkbox/",
    category: "Forms",
    description: "Checkbox accessibility patterns",
  },
  radio: {
    url: "https://www.magentaa11y.com/checklist-web/radio-button/",
    category: "Forms",
    description: "Radio button accessibility",
  },
  link: {
    url: "https://www.magentaa11y.com/checklist-web/link/",
    category: "Interactive",
    description: "Link accessibility testing",
  },
  form: {
    url: "https://www.magentaa11y.com/checklist-web/form/",
    category: "Forms",
    description: "Form accessibility patterns",
  },
  "text-input": {
    url: "https://www.magentaa11y.com/checklist-web/text-input/",
    category: "Forms",
    description: "Text input field accessibility",
  },
  select: {
    url: "https://www.magentaa11y.com/checklist-web/select/",
    category: "Forms",
    description: "Select dropdown accessibility",
  },
  heading: {
    url: "https://www.magentaa11y.com/checklist-web/heading/",
    category: "Structure",
    description: "Heading hierarchy and semantics",
  },
  image: {
    url: "https://www.magentaa11y.com/checklist-web/image/",
    category: "Media",
    description: "Image alternative text patterns",
  },
  table: {
    url: "https://www.magentaa11y.com/checklist-web/table/",
    category: "Structure",
    description: "Data table accessibility",
  },
  dialog: {
    url: "https://www.magentaa11y.com/checklist-web/dialog/",
    category: "Interactive",
    description: "Modal dialog accessibility",
  },
  menu: {
    url: "https://www.magentaa11y.com/checklist-web/menu/",
    category: "Navigation",
    description: "Navigation menu patterns",
  },
  tabs: {
    url: "https://www.magentaa11y.com/checklist-web/tabs/",
    category: "Interactive",
    description: "Tab panel accessibility",
  },
  accordion: {
    url: "https://www.magentaa11y.com/checklist-web/accordion/",
    category: "Interactive",
    description: "Accordion/disclosure patterns",
  },
  carousel: {
    url: "https://www.magentaa11y.com/checklist-web/carousel/",
    category: "Interactive",
    description: "Carousel/slideshow accessibility",
  },
  tooltip: {
    url: "https://www.magentaa11y.com/checklist-web/tooltip/",
    category: "Interactive",
    description: "Tooltip accessibility patterns",
  },
};

const TESTING_METHODS = {
  keyboard: {
    title: "Keyboard Testing",
    checks: [
      "✓ Tab key moves focus through all interactive elements",
      "✓ Shift+Tab moves focus backward",
      "✓ Enter/Space activates buttons and controls",
      "✓ Arrow keys navigate within composite widgets (menus, tabs, etc.)",
      "✓ Escape key closes dialogs and dismisses overlays",
      "✓ Focus indicator is clearly visible on all elements",
      "✓ No keyboard traps - can tab out of all elements",
      "✓ Focus order is logical and follows visual order",
    ],
  },
  "screen-reader": {
    title: "Screen Reader Testing",
    checks: [
      "✓ Element role is announced correctly (button, link, heading, etc.)",
      "✓ Element name/label is clear and descriptive",
      "✓ State is conveyed (checked, expanded, selected, etc.)",
      "✓ Instructions are provided where needed",
      "✓ Error messages are announced and associated with fields",
      "✓ Dynamic content updates are announced via ARIA live regions",
      "✓ Focus management after actions (dialog close, delete, etc.)",
      "✓ Landmarks are present (main, navigation, search, etc.)",
    ],
  },
  visual: {
    title: "Visual Testing",
    checks: [
      "✓ Color contrast ratio meets WCAG standards (4.5:1 normal, 3:1 large)",
      "✓ Focus indicator visible with sufficient contrast (3:1 minimum)",
      "✓ Touch target size minimum 44x44 CSS pixels",
      "✓ Text spacing is adequate and can be adjusted",
      "✓ Content reflows at 320px width without horizontal scroll",
      "✓ Information not conveyed by color alone",
      "✓ Content readable at 200% zoom",
      "✓ Animations can be paused or disabled",
    ],
  },
};

export async function handleMagentaTool(
  name: string,
  args: Record<string, any>
): Promise<any> {
  if (name === "get_magenta_component") {
    const { component } = args;

    if (!MAGENTA_COMPONENTS[component]) {
      return {
        error: `Unknown component '${component}'. Available: ${Object.keys(MAGENTA_COMPONENTS).join(", ")}`,
      };
    }

    const comp = MAGENTA_COMPONENTS[component];
    const url = comp.url;

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
          component,
          url,
          category: comp.category,
          description: comp.description,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const html = await response.text();

      return {
        component,
        url,
        category: comp.category,
        description: comp.description,
        title: `Magenta A11y: ${component.charAt(0).toUpperCase() + component.slice(1)} Component`,
        testing_overview: {
          keyboard: "Tab navigation, Enter/Space activation, arrow keys (if applicable), Escape to close, focus visible",
          screen_reader: "Proper role, label and state conveyed, instructions provided, errors accessible, focus management",
          visual: "Color contrast (4.5:1 minimum), focus indicator visible, touch target size (44x44px minimum), text spacing",
        },
        content: html.slice(0, 5000),
        note: "Content truncated. Visit URL for full testing checklist and code examples.",
      };
    } catch (error: any) {
      if (error.name === "AbortError") {
        return {
          component,
          url,
          error: "Request timeout after 30 seconds",
        };
      }
      return {
        component,
        url,
        error: `Failed to fetch: ${error.message}`,
      };
    }
  }

  if (name === "search_magenta_patterns") {
    const query = (args.query || "").toLowerCase();
    const matches: Array<{
      component: string;
      category: string;
      description: string;
      url: string;
    }> = [];

    for (const [key, value] of Object.entries(MAGENTA_COMPONENTS)) {
      if (
        key.includes(query) ||
        value.category.toLowerCase().includes(query) ||
        value.description.toLowerCase().includes(query)
      ) {
        matches.push({
          component: key,
          category: value.category,
          description: value.description,
          url: value.url,
        });
      }
    }

    if (matches.length === 0) {
      return {
        query,
        matches: [],
        suggestion: `No components found for '${query}'. Try: forms, interactive, navigation, structure, media`,
        all_components: Object.keys(MAGENTA_COMPONENTS),
      };
    }

    return {
      query,
      matches,
      count: matches.length,
    };
  }

  if (name === "get_magenta_testing_methods") {
    const { method } = args;

    if (method === "all") {
      return {
        methods: TESTING_METHODS,
        general_guidance:
          "Magenta A11y recommends testing with keyboard, screen readers (NVDA, JAWS, VoiceOver), and visual inspection. Test early and often in development.",
      };
    }

    if (!TESTING_METHODS[method as keyof typeof TESTING_METHODS]) {
      return {
        error: `Unknown method '${method}'. Available: keyboard, screen-reader, visual, all`,
      };
    }

    return {
      method,
      ...(TESTING_METHODS[method as keyof typeof TESTING_METHODS]),
    };
  }

  return { error: `Unknown Magenta tool: ${name}` };
}
