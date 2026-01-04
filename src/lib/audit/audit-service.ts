/**
 * Audit Service - Supabase Integration
 * 
 * Handles all database operations for audits:
 * - Create audit records
 * - Update status (queued → analyzing → complete)
 * - Save issues to database
 * - Fetch audit history
 */

import { supabase } from '../supabase';
import type { Database } from '@/types/database';
import type { AuditInput, AuditResult, AuditProgressCallback } from '@/types/audit';

type AuditRow = Database['public']['Tables']['audits']['Row'];
type AuditInsert = Database['public']['Tables']['audits']['Insert'];
type AuditUpdate = Database['public']['Tables']['audits']['Update'];
type IssueInsert = Database['public']['Tables']['issues']['Insert'];

/**
 * Create a new audit record in the database
 * Exported for server-side use in API endpoints
 */
export async function createAudit(input: AuditInput): Promise<string> {
  const auditData: AuditInsert = {
    user_id: input.user_id,
    session_id: input.session_id,
    input_type: input.input_type,
    input_value: input.input_value,
    url: input.input_type === 'url' ? input.input_value : null,
    suspected_issue: input.suspected_issue,
    status: 'queued',
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

  const { data, error } = await supabase
    .from('audits')
    .insert(auditData)
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create audit: ${error.message}`);
  }

  return data.id;
}

/**
 * Update audit status
 * Exported for server-side use in API endpoints
 */
export async function updateAuditStatus(
  auditId: string,
  status: AuditRow['status'],
  errorMessage?: string
): Promise<void> {
  const updateData: AuditUpdate = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'complete') {
    updateData.completed_at = new Date().toISOString();
  }

  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  const { error } = await supabase
    .from('audits')
    .update(updateData)
    .eq('id', auditId);

  if (error) {
    throw new Error(`Failed to update audit status: ${error.message}`);
  }
}

/**
 * Save audit results to database
 * Exported for server-side use in API endpoints
 */
export async function saveAuditResults(
  auditId: string,
  result: AuditResult
): Promise<void> {
  // Update audit with results
  const updateData: AuditUpdate = {
    status: 'complete',
    ai_model: result.ai_model,
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
    updated_at: new Date().toISOString(),
  };

  const { error: auditError } = await supabase
    .from('audits')
    .update(updateData)
    .eq('id', auditId);

  if (auditError) {
    throw new Error(`Failed to save audit results: ${auditError.message}`);
  }

  // Save issues
  if (result.issues.length > 0) {
    const issuesData: IssueInsert[] = result.issues.map(issue => ({
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

    const { error: issuesError } = await supabase
      .from('issues')
      .insert(issuesData);

    if (issuesError) {
      throw new Error(`Failed to save issues: ${issuesError.message}`);
    }
  }
}

/**
 * Run a complete accessibility audit with database tracking
 * Calls server-side API endpoint to avoid exposing API keys
 */
export async function runAudit(
  input: AuditInput,
  onProgress?: AuditProgressCallback
): Promise<string> {
  onProgress?.({ status: 'queued', message: 'Starting audit...' });

  try {
    // Call server-side API endpoint
    const response = await fetch('/api/run-audit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Audit failed');
    }

    const { auditId } = await response.json();

    onProgress?.({
      status: 'complete',
      message: 'Audit complete!',
    });

    return auditId;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    onProgress?.({ status: 'failed', message: errorMessage });
    throw error;
  }
}

/**
 * Get audit by ID with all issues
 */
export async function getAudit(auditId: string): Promise<AuditRow | null> {
  const { data, error } = await supabase
    .from('audits')
    .select('*')
    .eq('id', auditId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch audit: ${error.message}`);
  }

  return data;
}

/**
 * Get issues for an audit
 */
export async function getAuditIssues(auditId: string) {
  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .eq('audit_id', auditId)
    .order('severity', { ascending: false })
    .order('wcag_criterion', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch issues: ${error.message}`);
  }

  return data || [];
}

/**
 * Get user's audit history
 */
export async function getUserAudits(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('audits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch audit history: ${error.message}`);
  }

  return data || [];
}
