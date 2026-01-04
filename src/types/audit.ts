// Audit result types for the accessibility checker

import type { Database } from './database';

export type InputType = Database['public']['Tables']['audits']['Row']['input_type'];
export type AuditStatus = Database['public']['Tables']['audits']['Row']['status'];
export type IssueSource = Database['public']['Tables']['issues']['Row']['source'];
export type IssueSeverity = Database['public']['Tables']['issues']['Row']['severity'];
export type WCAGPrinciple = Database['public']['Tables']['issues']['Row']['wcag_principle'];
export type WCAGLevel = Database['public']['Tables']['issues']['Row']['wcag_level'];

// Individual accessibility issue
export interface Issue {
  wcag_criterion: string;
  wcag_level: WCAGLevel;
  wcag_principle: WCAGPrinciple;
  title: string;
  description: string;
  severity: IssueSeverity;
  source: IssueSource;
  confidence_score?: number;
  element_selector?: string;
  element_html?: string;
  element_context?: string;
  how_to_fix: string;
  code_example?: string;
  wcag_url?: string;
}

// Aggregated metrics by category
export interface AuditMetrics {
  total_issues: number;
  critical_issues: number;
  serious_issues: number;
  moderate_issues: number;
  minor_issues: number;
  perceivable_issues: number;
  operable_issues: number;
  understandable_issues: number;
  robust_issues: number;
}

// Complete audit result
export interface AuditResult {
  issues: Issue[];
  metrics: AuditMetrics;
  ai_model: string;
  url?: string;
}

// Input for running an audit
export interface AuditInput {
  input_type: InputType;
  input_value: string;
  suspected_issue?: string;
  user_id: string;
  session_id?: string;
}

// Progress callback for streaming updates
export interface AuditProgress {
  status: AuditStatus;
  message: string;
  issues_found?: number;
}

export type AuditProgressCallback = (progress: AuditProgress) => void;
