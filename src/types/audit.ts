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
  user_impact?: string;
  expert_analysis?: string;
  testing_instructions?: string;
  // Magenta A11y-style testing guidance
  how_to_reproduce?: string; // Step-by-step reproduction instructions
  keyboard_testing?: string; // Keyboard interaction testing steps (Tab, Enter, Space, Arrow keys)
  screen_reader_testing?: string; // Screen reader testing (Name, Role, State, Value)
  visual_testing?: string; // Visual inspection testing steps
  expected_behavior?: string; // How it should work according to WCAG success criteria
  // Swedish ETU-style formatted report
  report_text?: string; // Complete formatted report text in Swedish following ETU template
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

// Audit trail tracking
export interface AgentTraceStep {
  timestamp: string;
  action: string;
  tool?: string;
  input?: Record<string, unknown>;
  output?: string;
  reasoning?: string;
}

export interface AuditMethodologyPhase {
  phase: number;
  name: string;
  tools: string[];
  description: string;
}

export interface AuditMethodology {
  model: string;
  phases: AuditMethodologyPhase[];
  totalToolCalls: number;
  uniqueToolsUsed: number;
  sourcesConsulted: string[];
  wcagCriteriaResearched: number;
  ariaPatternsConsulted: number;
}

export interface AgentTrace {
  steps: AgentTraceStep[];
  tools_used: string[];
  sources_consulted: string[];
  duration_ms?: number;
  methodology?: AuditMethodology;
}

// Executive summary from AI expert analysis
export interface ExecutiveSummary {
  overall_assessment: string;
  compliance_level: string;
  top_priorities: string[];
  estimated_effort: string;
  risk_level: string;
}

// Pattern analysis identifying systemic issues
export interface PatternAnalysis {
  systemic_issues: string[];
  positive_patterns: string[];
  recommendations: string[];
}

// Complete audit result
export interface AuditResult {
  issues: Issue[];
  metrics: AuditMetrics;
  ai_model: string;
  url?: string;
  agent_trace?: AgentTrace;
  executive_summary?: ExecutiveSummary;
  pattern_analysis?: PatternAnalysis;
}

// Input for running an audit
export interface AuditInput {
  input_type: InputType;
  input_value: string;
  suspected_issue?: string;
  user_id: string;
  session_id?: string;
  document_path?: string;
  document_type?: 'pdf' | 'docx';
}

// Progress callback for streaming updates
export interface AuditProgress {
  status: AuditStatus;
  message: string;
  issues_found?: number;
}

export type AuditProgressCallback = (progress: AuditProgress) => void;
