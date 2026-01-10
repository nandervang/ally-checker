/**
 * Netlify Function wrapper for Python report generation
 * Calls the Python report generator as a subprocess
 */

import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { spawn } from "child_process";
import path from "path";

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

  // Verify authentication
  const apiKey = event.headers["x-report-service-key"] || event.headers["X-Report-Service-Key"];
  const expectedKey = process.env.REPORT_SERVICE_KEY;

  if (!expectedKey) {
    return {
      statusCode: 500,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "SERVER_CONFIG_ERROR", message: "Report service not configured" }),
    };
  }

  if (!apiKey || apiKey !== expectedKey) {
    return {
      statusCode: 401,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "UNAUTHORIZED", message: "Invalid or missing API key" }),
    };
  }

  try {
    // Parse request body
    const requestBody = JSON.parse(event.body || "{}");

    // Call Python script
    const pythonDir = path.join(__dirname, "generate-report");
    const pythonScript = path.join(pythonDir, "cli.py");

    return await new Promise((resolve) => {
      const python = spawn("python3", [pythonScript], {
        cwd: pythonDir,
        env: {
          ...process.env,
          REQUEST_BODY: JSON.stringify(requestBody),
        },
      });

      let stdout = "";
      let stderr = "";
      const chunks: Buffer[] = [];

      python.stdout.on("data", (data) => {
        chunks.push(data);
        stdout += data.toString();
      });

      python.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      python.on("close", (code) => {
        if (code !== 0) {
          console.error("Python error:", stderr);
          resolve({
            statusCode: 500,
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ 
              error: "REPORT_GENERATION_ERROR", 
              message: `Report generation failed: ${stderr.slice(0, 500)}` 
            }),
          });
          return;
        }

        // Try to parse JSON response first
        try {
          const jsonResponse = JSON.parse(stdout);
          if (jsonResponse.error) {
            resolve({
              statusCode: jsonResponse.statusCode || 500,
              headers: { ...headers, "Content-Type": "application/json" },
              body: stdout,
            });
            return;
          }
        } catch {
          // Not JSON, assume it's binary data (Word document)
        }

        // Return binary data
        const buffer = Buffer.concat(chunks);
        const base64 = buffer.toString("base64");

        resolve({
          statusCode: 200,
          headers: {
            ...headers,
            "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "Content-Disposition": `attachment; filename="accessibility-report-${new Date().toISOString().split('T')[0]}.docx"`,
          },
          body: base64,
          isBase64Encoded: true,
        });
      });

      // Set timeout
      setTimeout(() => {
        python.kill();
        resolve({
          statusCode: 408,
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ error: "TIMEOUT", message: "Report generation timeout" }),
        });
      }, 55000); // 55 seconds (function timeout is 60s)
    });
  } catch (error) {
    console.error("Handler error:", error);
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
