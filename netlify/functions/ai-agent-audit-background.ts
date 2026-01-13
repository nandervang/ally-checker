
import type { Handler, HandlerEvent } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { runAIAudit, type AuditRequest } from "./lib/audit-logic.js";
import type { Database } from "../../src/types/database";

// Function to update audit progress
async function updateProgress(supabase: any, auditId: string, progress: number, stage: string) {
  await supabase
    .from('audits')
    .update({ 
      progress, 
      current_stage: stage,
      last_updated_at: new Date().toISOString()
    })
    .eq('id', auditId);
}

export const handler: Handler = async (event: HandlerEvent) => {
  // Only accept POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase not configured');
    return { statusCode: 500, body: "Server Configuration Error" };
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseKey);
  
  try {
    const payload = JSON.parse(event.body || "{}");
    const { auditId } = payload;

    if (!auditId) {
      console.error("Missing auditId in background task payload");
      return { statusCode: 400, body: "Missing auditId" };
    }

    console.log(`Starting background audit for ${auditId}`);

    // Update status to analyzing
    await supabase
      .from('audits')
      .update({ 
        status: 'analyzing', 
        progress: 10,
        current_stage: 'Initializing AI Agent...',
        started_at: new Date().toISOString()
      })
      .eq('id', auditId);

    // Fetch the audit request details
    const { data: audit, error: fetchError } = await supabase
      .from('audits')
      .select('*')
      .eq('id', auditId)
      .single();

    if (fetchError || !audit) {
      console.error(`Audit ${auditId} not found`, fetchError);
      return { statusCode: 404, body: "Audit not found" };
    }

    // Reconstruct AuditRequest
    const request: AuditRequest = {
      mode: audit.input_type as "url" | "html" | "snippet" | "document",
      content: audit.input_value || audit.url || "",
      model: (audit.ai_model?.includes('gemini') ? 'gemini' : 'claude') as "gemini" | "claude",
      geminiModel: audit.ai_model as any,
      documentType: audit.document_type as any,
      filePath: audit.document_path || undefined,
      sessionId: audit.session_id,
      userId: audit.user_id || undefined
    };

    // Update progress: Automated Analysis
    await updateProgress(supabase, auditId, 20, 'Running Axe-Core Automated Analysis...');

    // Run the AI Audit
    // TODO: In a more advanced version, we can pass a callback for incremental finding updates
    const result = await runAIAudit(request);

    // Update progress: Processing findings
    await updateProgress(supabase, auditId, 80, 'Processing & Saving Findings...');

    // Save Results (Logic moved from ai-agent-audit.ts)
    
    // Update Audit Record
    const { error: updateError } = await supabase
      .from('audits')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        progress: 100,
        current_stage: 'Complete',
        total_issues: result.summary.totalIssues || 0,
        critical_issues: result.summary.criticalCount || 0,
        serious_issues: result.summary.seriousCount || 0,
        moderate_issues: result.summary.moderateCount || 0,
        minor_issues: result.summary.minorCount || 0,
        // Audit methodology trace
        audit_methodology: result.auditMethodology || {},
        mcp_tools_used: result.mcpToolsUsed || [],
        sources_consulted: result.sourcesConsulted || [],
        // Agent trace
        agent_trace: {
          steps: [
            ...(result.toolResults || []).map((tr: any) => ({
              timestamp: tr.timestamp,
              action: 'tool_execution',
              tool: tr.tool,
              input: tr.args,
              output: typeof tr.result === 'string' ? tr.result.substring(0, 200) + (tr.result.length > 200 ? '...' : '') : 'Success (JSON result)',
              duration_ms: tr.duration
            })),
            {
              timestamp: new Date().toISOString(),
              action: 'ai_agent_analysis',
              tool: result.summary.model || 'gemini-2.5-flash',
              reasoning: `Analyzed ${request.mode} using ${result.summary.model || 'gemini-2.5-flash'}`,
              output: `Found ${result.summary.totalIssues || 0} accessibility issues`
            }
          ],
          tools_used: result.mcpToolsUsed || [],
          sources_consulted: result.sourcesConsulted || [],
          duration_ms: result.duration_ms
        },
        tools_used: result.mcpToolsUsed || [],
        analysis_steps: result.auditMethodology?.phases?.map((p: any) => p.name) || [],
      })
      .eq('id', auditId);

    if (updateError) {
      console.error('Failed to update audit record:', updateError);
      throw updateError;
    }

    // Save issues
    if (result.issues && result.issues.length > 0) {
      const issuesData = result.issues.map((issue: any) => ({
        audit_id: auditId,
        wcag_criterion: issue.wcag_criterion || issue.criterion || issue.wcagCriterion || '',
        wcag_level: issue.wcag_level || 'AA',
        wcag_principle: issue.wcag_principle || 'perceivable',
        severity: issue.severity || 'moderate',
        title: issue.title || issue.description || '',
        description: issue.description || issue.explanation || '',
        source: issue.source || 'ai-heuristic',
        confidence_score: issue.confidence_score,
        element_selector: issue.element_selector || issue.selector || issue.element || null,
        element_html: issue.element_html || issue.html || null,
        element_context: issue.element_context || null,
        how_to_fix: issue.how_to_fix || issue.remediation || issue.fix || 'Review WCAG guidelines for remediation steps.',
        code_example: issue.code_example || issue.code || issue.codeSnippet || null,
        wcag_url: issue.wcag_url || issue.wcagUrl || issue.helpUrl || null,
        wcag_explanation: issue.wcag_explanation || null,
        how_to_reproduce: issue.how_to_reproduce || null,
        user_impact: issue.user_impact || null,
        fix_priority: issue.fix_priority || (issue.severity === 'critical' ? 'MÅSTE' : issue.severity === 'serious' ? 'BÖR' : 'KAN'),
        en_301_549_ref: issue.en_301_549_ref || null,
        webbriktlinjer_url: issue.webbriktlinjer_url || null,
        screenshot_url: issue.screenshot_url || null,
        keyboard_testing: issue.keyboard_testing || null,
        screen_reader_testing: issue.screen_reader_testing || null,
        visual_testing: issue.visual_testing || null,
        expected_behavior: issue.expected_behavior || null,
        // New: Handle structured screenshot data if present
        // Note: DB schema might not have screenshot_data column yet, but issue said "update schema".
        // For now we skip it or put it in metadata if available.
      }));

      const { error: issuesError } = await supabase
        .from('issues')
        .insert(issuesData);

      if (issuesError) {
        console.error('Failed to save issues:', issuesError);
        // We logged it, but we successfully updated the audit status, so we finish.
      } else {
        console.log(`Saved ${issuesData.length} issues`);
      }
    }

    return { statusCode: 200, body: "Audit Complete" };

  } catch (error) {
    console.error("Background Audit Error:", error);
    
    // Attempt to update audit status to failed
    if ( payload?.auditId ) {
         await supabase
        .from('audits')
        .update({ 
            status: 'failed', 
            error_message: error instanceof Error ? error.message : String(error),
            completed_at: new Date().toISOString()
        })
        .eq('id', payload.auditId);
    }

    return { statusCode: 500, body: "Internal Error" };
  }
};
