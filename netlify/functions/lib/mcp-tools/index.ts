/**
 * TypeScript MCP Tools
 * Native Node.js implementations of MCP tools for Netlify Functions
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { fetchTools, handleFetchTool } from "./fetch.js";
import { axeTools, handleAxeTool } from "./axe-core.js";
import { wcagTools, handleWcagTool } from "./wcag-docs.js";
import { waiTools, handleWaiTool } from "./wai-tips.js";
import { magentaTools, handleMagentaTool } from "./magenta.js";
import { playwrightTools, handlePlaywrightTool } from "./playwright.js";
import { documentTools, handleDocumentTool } from "./document-accessibility.js";

/**
 * Get all available MCP tools
 */
export function getAllTools(): Tool[] {
  return [
    ...fetchTools,
    ...axeTools,
    ...wcagTools,
    ...waiTools,
    ...magentaTools,
    ...playwrightTools,
    ...documentTools,
  ];
}

/**
 * Execute an MCP tool
 */
export async function executeTool(toolName: string, args: any): Promise<any> {
  // Route to appropriate handler based on tool name
  if (toolName.startsWith("fetch_")) {
    return await handleFetchTool(toolName, args);
  }
  
  if (toolName.startsWith("analyze_")) {
    return await handleAxeTool(toolName, args);
  }
  
  if (toolName.startsWith("audit_pdf") || toolName.startsWith("audit_docx")) {
    return await handleDocumentTool(toolName, args);
  }
  
  if (toolName.startsWith("get_wcag_") || toolName.startsWith("search_wcag_") || toolName === "get_all_criteria") {
    return await handleWcagTool(toolName, args);
  }
  
  if (toolName.startsWith("get_wai_") || toolName.startsWith("search_wai_") || toolName.startsWith("get_aria_")) {
    return await handleWaiTool(toolName, args);
  }
  
  if (toolName.startsWith("get_magenta_") || toolName.startsWith("search_magenta_")) {
    return await handleMagentaTool(toolName, args);
  }
  
  if (toolName.startsWith("capture_") || toolName === "test_keyboard_navigation" || toolName === "check_focus_styles") {
    return await handlePlaywrightTool(toolName, args);
  }
  
  throw new Error(`Unknown tool: ${toolName}`);
}

/**
 * Convert TypeScript tool to Gemini function declaration format
 */
export function convertToGeminiFormat(tool: Tool): any {
  return {
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema,
  };
}
