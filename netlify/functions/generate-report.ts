/**
 * Netlify Function for Professional Report Generation
 * Generates high-quality accessibility reports in multiple formats
 */

import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { 
  generateWordReport, 
  generateHTMLReport, 
  generateMarkdownReport,
  type AuditData,
  type ReportConfig
} from "./lib/reportGenerator";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Report-Service-Key",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: "",
    };
  }

  // Only accept POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "METHOD_NOT_ALLOWED", message: "Only POST requests are accepted" }),
    };
  }

  // Verify authentication (optional - allow if not configured)
  const apiKey = event.headers["x-report-service-key"] || event.headers["X-Report-Service-Key"];
  const expectedKey = process.env.REPORT_SERVICE_KEY;

  // If REPORT_SERVICE_KEY is configured, require and validate it
  if (expectedKey) {
    if (!apiKey || apiKey !== expectedKey) {
      console.error('[AUTH] API key validation failed');
      return {
        statusCode: 401,
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "UNAUTHORIZED", message: "Invalid or missing API key" }),
      };
    }
  }

  try {
    // Parse request body
    const requestBody = JSON.parse(event.body || "{}");
    const { 
      audit_data, 
      format = "word", 
      template = "wcag-international",  // Changed default to wcag-international per spec
      locale = "sv-SE",
      metadata,
      include_ai_summary,
      executive_summary
    } = requestBody;

    if (!audit_data || !audit_data.issues) {
      return {
        statusCode: 400,
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "INVALID_REQUEST", message: "Missing audit_data or issues" }),
      };
    }

    const config: ReportConfig = {
      template,
      locale,
      format,
      include_ai_summary,
      executive_summary
    };

    console.log(`[REPORT] Generating ${format} report with ${audit_data.issues.length} issues`);

    // Generate report based on format
    if (format === "word") {
      const buffer = await generateWordReport(audit_data as AuditData, config);
      const base64 = buffer.toString("base64");
      
      return {
        statusCode: 200,
        headers: {
          ...headers,
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="accessibility-report-${new Date().toISOString().split('T')[0]}.docx"`,
        },
        body: base64,
        isBase64Encoded: true,
      };
    } else if (format === "html") {
      const html = generateHTMLReport(audit_data as AuditData, config);
      
      return {
        statusCode: 200,
        headers: {
          ...headers,
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="accessibility-report-${new Date().toISOString().split('T')[0]}.html"`,
        },
        body: html,
      };
    } else if (format === "markdown") {
      const markdown = generateMarkdownReport(audit_data as AuditData, config);
      
      return {
        statusCode: 200,
        headers: {
          ...headers,
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="accessibility-report-${new Date().toISOString().split('T')[0]}.md"`,
        },
        body: markdown,
      };
    } else {
      return {
        statusCode: 400,
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "INVALID_FORMAT", message: `Unsupported format: ${format}` }),
      };
    }
  } catch (error) {
    console.error("[REPORT] Generation error:", error);
    return {
      statusCode: 500,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ 
        error: "INTERNAL_ERROR", 
        message: error instanceof Error ? error.message : "Unknown error" 
      }),
    };
  }
};

export { handler };
