/**
 * MCP Axe-Core Tool - TypeScript Implementation
 * Runs axe-core accessibility analysis on HTML content
 * 
 * Note: This uses axe-core npm package directly instead of Playwright
 * for serverless environment compatibility.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { JSDOM } from "jsdom";
import axe from "axe-core";

export const axeTools: Tool[] = [
  {
    name: "analyze_html",
    description: "Run axe-core accessibility analysis on HTML content. Returns WCAG violations with severity, impact, and remediation guidance.",
    inputSchema: {
      type: "object",
      properties: {
        html: {
          type: "string",
          description: "The HTML content to analyze"
        },
        rules: {
          type: "array",
          description: "Specific axe rules to run (optional, defaults to wcag2aa)",
          items: { type: "string" }
        },
        context: {
          type: "object",
          description: "Optional context (url, filename) for reporting",
          properties: {
            url: { type: "string" },
            filename: { type: "string" }
          }
        }
      },
      required: ["html"]
    }
  },
  {
    name: "analyze_url",
    description: "Fetch a URL and run axe-core analysis on it",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL to fetch and analyze",
        },
        timeout: {
          type: "number",
          description: "Page load timeout in milliseconds (default: 30000)",
        }
      },
      required: ["url"]
    }
  }
];

export async function handleAxeTool(name: string, args: any): Promise<any> {
  if (name === "analyze_html") {
    const html = args.html;
    const rules = args.rules || ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
    const context = args.context || {};
    
    try {
      // Create a virtual DOM using JSDOM
      const dom = new JSDOM(html, {
        url: context.url || "http://localhost",
        contentType: "text/html",
        runScripts: "dangerously", // Required for axe-core
      });
      
      const { window } = dom;
      const { document } = window;
      
      // Inject axe-core into the virtual window
      // @ts-ignore - axe needs to be attached to window
      window.axe = axe;
      
      // Run axe analysis
      const results = await new Promise<any>((resolve, reject) => {
        try {
          // @ts-ignore
          window.axe.run(document, {
            runOnly: {
              type: 'tag',
              values: rules
            },
            resultTypes: ['violations', 'passes', 'incomplete'],
          }, (err: Error, results: any) => {
            if (err) reject(err);
            else resolve(results);
          });
        } catch (error) {
          reject(error);
        }
      });
      
      // Format results for MCP response
      return {
        url: context.url || null,
        filename: context.filename || null,
        timestamp: new Date().toISOString(),
        violations: results.violations.map((v: any) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          help: v.help,
          helpUrl: v.helpUrl,
          tags: v.tags,
          nodes: v.nodes.map((n: any) => ({
            html: n.html,
            target: n.target,
            failureSummary: n.failureSummary,
            impact: n.impact,
          })),
        })),
        passes: results.passes.length,
        incomplete: results.incomplete.length,
        inapplicable: results.inapplicable.length,
        summary: {
          total: results.violations.length,
          critical: results.violations.filter((v: any) => v.impact === 'critical').length,
          serious: results.violations.filter((v: any) => v.impact === 'serious').length,
          moderate: results.violations.filter((v: any) => v.impact === 'moderate').length,
          minor: results.violations.filter((v: any) => v.impact === 'minor').length,
        }
      };
    } catch (error) {
      throw new Error(`Axe analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  if (name === "analyze_url") {
    const url = args.url;
    const timeout = args.timeout || 30000;
    
    try {
      // Fetch the URL
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'A11yChecker/1.0 (Accessibility Audit Bot)',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      // Analyze the fetched HTML
      return await handleAxeTool("analyze_html", {
        html,
        context: { url }
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeout}ms`);
      }
      throw error;
    }
  }
  
  throw new Error(`Unknown axe tool: ${name}`);
}
