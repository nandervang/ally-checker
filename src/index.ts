import { serve } from "bun";
import index from "./index.html";
import { runGeminiAudit } from "./lib/audit/gemini-agent";
import type { AuditInput } from "./types/audit";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types/database";

// Create Supabase client for server-side auth
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

function createAuthenticatedClient(authToken: string) {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  });
}

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
          // Get auth token from header
          const authHeader = req.headers.get('Authorization');
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return Response.json(
              { error: 'Unauthorized - missing auth token' },
              { status: 401 }
            );
          }

          const authToken = authHeader.replace('Bearer ', '');
          
          // Create authenticated Supabase client for this request
          const authedSupabase = createAuthenticatedClient(authToken);
          
          const input: AuditInput = await req.json();

          // Verify token and get user
          const { data: { user }, error: authError } = await authedSupabase.auth.getUser();
          if (authError || !user) {
            return Response.json(
              { error: 'Unauthorized - invalid token' },
              { status: 401 }
            );
          }

          // Create audit record with authenticated client
          const auditData = {
            user_id: input.user_id,
            session_id: input.session_id,
            input_type: input.input_type,
            input_value: input.input_value,
            url: input.input_type === 'url' ? input.input_value : null,
            suspected_issue: input.suspected_issue,
            status: 'queued' as const,
            total_issues: 0,
            critical_issues: 0,
            serious_issues: 0,
            moderate_issues: 0,
            minor_issues: 0,
            perceivable_issues: 0,
            operable_issues: 0,
            understandable_issues: 0,
            robust_issues: 0,
          };

          const { data: audit, error: createError } = await authedSupabase
            .from('audits')
            .insert(auditData)
            .select('id')
            .single();

          if (createError) {
            throw new Error(`Failed to create audit: ${createError.message}`);
          }

          const auditId = audit.id;

          try {
            // Update status to analyzing
            await authedSupabase
              .from('audits')
              .update({ status: 'analyzing' })
              .eq('id', auditId);

            // Run Gemini audit server-side (has access to process.env)
            const result = await runGeminiAudit(input);

            // Save results
            await authedSupabase
              .from('audits')
              .update({
                status: 'complete',
                ai_model: result.ai_model,
                agent_trace: result.agent_trace,
                tools_used: result.agent_trace?.tools_used || [],
                total_issues: result.metrics.total_issues,
                critical_issues: result.metrics.critical_issues,
                serious_issues: result.metrics.serious_issues,
                moderate_issues: result.metrics.moderate_issues,
                minor_issues: result.metrics.minor_issues,
                perceivable_issues: result.metrics.perceivable_issues,
                operable_issues: result.metrics.operable_issues,
                understandable_issues: result.metrics.understandable_issues,
                robust_issues: result.metrics.robust_issues,
                completed_at: new Date().toISOString(),
              })
              .eq('id', auditId);

            // Save issues
            if (result.issues.length > 0) {
              const issuesData = result.issues.map(issue => ({
                audit_id: auditId,
                wcag_criterion: issue.wcag_criterion,
                wcag_level: issue.wcag_level,
                wcag_principle: issue.wcag_principle,
                title: issue.title,
                description: issue.description,
                severity: issue.severity,
                source: issue.source,
                confidence_score: issue.confidence_score,
                element_selector: issue.element_selector,
                element_html: issue.element_html,
                element_context: issue.element_context,
                how_to_fix: issue.how_to_fix,
                code_example: issue.code_example,
                wcag_url: issue.wcag_url,
              }));

              await authedSupabase
                .from('issues')
                .insert(issuesData);
            }

            return Response.json({ auditId, success: true });
          } catch (error) {
            // Mark as failed
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await authedSupabase
              .from('audits')
              .update({ 
                status: 'failed',
                error_message: errorMessage,
              })
              .eq('id', auditId);
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

  development: import.meta.env.DEV && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
