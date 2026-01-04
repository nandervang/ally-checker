import { serve } from "bun";
import index from "./index.html";
import { runGeminiAudit } from "./lib/audit/gemini-agent";
import { createAudit, updateAuditStatus, saveAuditResults } from "./lib/audit/audit-service";
import type { AuditInput } from "./types/audit";

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async req => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },

    "/api/run-audit": {
      async POST(req) {
        try {
          const input: AuditInput = await req.json();

          // Create audit record
          const auditId = await createAudit(input);

          try {
            // Update status to analyzing
            await updateAuditStatus(auditId, 'analyzing');

            // Run Gemini audit server-side (has access to process.env)
            const result = await runGeminiAudit(input);

            // Save results
            await saveAuditResults(auditId, result);

            return Response.json({ auditId, success: true });
          } catch (error) {
            // Mark as failed
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await updateAuditStatus(auditId, 'failed', errorMessage);
            throw error;
          }
        } catch (error) {
          console.error('Audit API error:', error);
          return Response.json(
            {
              error: error instanceof Error ? error.message : 'Internal server error',
            },
            { status: 500 }
          );
        }
      },
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
