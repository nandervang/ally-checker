/**
 * MCP Document Accessibility Tools
 * 
 * Bridges the Node.js agent to the Python-based document accessibility server.
 * Requires a local Python environment with dependencies installed.
 */

import { exec } from "child_process";
import path from "path";
import util from "util";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

const execAsync = util.promisify(exec);

export const documentTools: Tool[] = [
  {
    name: "audit_docx",
    description: "Perform comprehensive DOCX accessibility audit following WCAG 2.2 AA standards. Checks heading structure, alt text, tables, and more.",
    inputSchema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Absolute path to the DOCX file to audit"
        },
        detailed: {
          type: "boolean",
          description: "Run detailed analysis",
          default: true
        }
      },
      required: ["file_path"]
    }
  },
  {
    name: "audit_pdf",
    description: "Perform comprehensive PDF accessibility audit following PDF/UA and WCAG 2.2 AA standards. Checks tags, reading order, alt text, and more.",
    inputSchema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Absolute path to the PDF file to audit"
        },
        detailed: {
          type: "boolean",
          description: "Run detailed analysis",
          default: true
        }
      },
      required: ["file_path"]
    }
  }
];

export async function handleDocumentTool(name: string, args: any): Promise<any> {
  // Locate the Python CLI script
  // In development, it's in mcp-servers/document-accessibility-server/
  const projectRoot = path.resolve(__dirname, "../../../../");
  const scriptPath = path.join(
    projectRoot, 
    "mcp-servers/document-accessibility-server/cli.py"
  );

  const filePath = args.file_path;
  if (!filePath) {
    throw new Error("Missing file_path argument");
  }

  try {
    const command = name === "audit_docx" ? "audit_docx" : "audit_pdf";
    const detailFlag = args.detailed !== false ? "--detailed" : "";
    
    // Execute Python script
    // Note: This relies on 'python3' being in the PATH and dependencies installed
    const { stdout, stderr } = await execAsync(
      `python3 "${scriptPath}" ${command} "${filePath}" ${detailFlag}`
    );

    if (stderr && !stdout) {
      console.error(`Python stderr: ${stderr}`);
      throw new Error(`Document audit failed: ${stderr}`);
    }

    try {
      return JSON.parse(stdout);
    } catch (parseError) {
      console.error("Failed to parse Python output:", stdout);
      throw new Error(`Invalid JSON output from document auditor: ${parseError}`);
    }

  } catch (error: any) {
    console.error("Document tool error:", error);
    
    // Provide a helpful error message if Python is missing or script fails
    if (error.code === 127 || error.message.includes("python3: not found")) {
      return {
        error: "Python environment not available. Document auditing is currently only supported in local environments with configured Python dependencies.",
        details: error.message
      };
    }
    
    if (error.message.includes("File not found")) {
      return {
        error: "Document auditor script not found. Please ensure the mcp-servers directory is present.",
        path: scriptPath
      };
    }

    return {
      error: `Document audit failed: ${error.message}`,
      wcag_principle: "Robust",
      severity: "critical",
      issues: []
    };
  }
}
