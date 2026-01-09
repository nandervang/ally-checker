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
import { uploadDocument } from '../storage';
import type { Database } from '@/types/database';
import type { AuditInput, AuditResult, AuditProgressCallback } from '@/types/audit';

type AuditRow = Database['public']['Tables']['audits']['Row'];
type AuditInsert = Database['public']['Tables']['audits']['Insert'];
type AuditUpdate = Database['public']['Tables']['audits']['Update'];
type IssueInsert = Database['public']['Tables']['issues']['Insert'];

/**
 * Upload document and create audit record
 */
export async function uploadDocumentForAudit(
  file: File,
  userId: string,
  sessionId?: string
): Promise<{ auditId: string; documentPath: string; documentType: 'pdf' | 'docx' }> {
  // Upload document to storage
  const uploadResult = await uploadDocument(file, userId);
  
  if (uploadResult.error || !uploadResult.path) {
    throw new Error(`Document upload failed: ${uploadResult.error || 'Unknown error'}`);
  }

  const documentType = file.name.endsWith('.pdf') ? 'pdf' : 'docx';

  // Create audit record with document reference
  const auditData: AuditInsert = {
    user_id: userId,
    session_id: sessionId,
    input_type: 'document',
    input_value: file.name,
    document_path: uploadResult.path,
    document_type: documentType,
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

  return {
    auditId: data.id,
    documentPath: uploadResult.path,
    documentType,
  };
}

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
    document_path: input.document_path,
    document_type: input.document_type,
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
    agent_trace: result.agent_trace as Record<string, unknown> | null | undefined,
    tools_used: result.agent_trace?.tools_used,
    analysis_steps: result.agent_trace?.steps.map(s => s.action),
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
      user_impact: issue.user_impact,
      how_to_reproduce: issue.how_to_reproduce,
      keyboard_testing: issue.keyboard_testing,
      screen_reader_testing: issue.screen_reader_testing,
      visual_testing: issue.visual_testing,
      expected_behavior: issue.expected_behavior,
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
  onProgress?: AuditProgressCallback,
  preferredModel?: 'claude' | 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gpt4'
): Promise<string> {
  onProgress?.({ status: 'queued', message: 'Starting audit...' });

  try {
    // Get current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('You must be logged in to run audits');
    }

    // Map preferredModel to the model format expected by the backend
    let model: 'claude' | 'gemini' | 'gpt4' = 'gemini';
    let geminiModelVariant: 'gemini-2.5-flash' | 'gemini-2.5-pro' | undefined;
    
    if (preferredModel === 'claude') {
      model = 'claude';
    } else if (preferredModel === 'gpt4') {
      model = 'gpt4';
    } else if (preferredModel === 'gemini-2.5-flash') {
      model = 'gemini';
      geminiModelVariant = 'gemini-2.5-flash';
    } else if (preferredModel === 'gemini-2.5-pro') {
      model = 'gemini';
      geminiModelVariant = 'gemini-2.5-pro';
    } else {
      // Default to Gemini 2.5 Flash if no valid model specified
      model = 'gemini';
      geminiModelVariant = 'gemini-2.5-flash';
    }

    // Transform AuditInput to match AI agent function's expected format
    const agentRequest = {
      mode: input.input_type, // 'url' | 'html' | 'snippet' | 'document'
      content: input.input_value,
      model,
      geminiModel: geminiModelVariant,
      language: 'en',
      documentType: input.document_type,
      filePath: input.document_path,
    };

    // Call Netlify function for AI agent audit
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };
    
    // Add API key if configured
    const apiKey = import.meta.env?.VITE_REPORT_SERVICE_KEY;
    console.log('[DEBUG] VITE_REPORT_SERVICE_KEY:', apiKey ? 'SET' : 'NOT SET', apiKey?.substring(0, 10));
    if (apiKey) {
      headers['X-Report-Service-Key'] = apiKey;
    }

    const response = await fetch('/.netlify/functions/ai-agent-audit', {
      method: 'POST',
      headers,
      body: JSON.stringify(agentRequest),
    });

    if (!response.ok) {
      let errorMessage = `Audit failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.details || errorMessage;
        console.error('Audit Error:', errorData);
      } catch (jsonError) {
        // If JSON parsing failed, body is already consumed - use status text
        console.error('Audit Error Response (non-JSON):', response.statusText, jsonError);
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
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
