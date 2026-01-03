// Database types generated from Supabase schema
export interface Database {
  public: {
    Tables: {
      user_sessions: {
        Row: {
          id: string;
          supabase_user_id: string | null;
          locale: 'sv-SE' | 'en-US';
          preferences: Record<string, any>;
          created_at: string;
          last_active_at: string;
        };
        Insert: {
          id?: string;
          supabase_user_id?: string | null;
          locale?: 'sv-SE' | 'en-US';
          preferences?: Record<string, any>;
          created_at?: string;
          last_active_at?: string;
        };
        Update: {
          id?: string;
          supabase_user_id?: string | null;
          locale?: 'sv-SE' | 'en-US';
          preferences?: Record<string, any>;
          created_at?: string;
          last_active_at?: string;
        };
      };
      audits: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          input_type: 'url' | 'html' | 'snippet';
          input_value: string;
          url: string | null;
          suspected_issue: string | null;
          status: 'queued' | 'analyzing' | 'complete' | 'failed';
          ai_model: string | null;
          total_issues: number;
          critical_issues: number;
          serious_issues: number;
          moderate_issues: number;
          minor_issues: number;
          perceivable_issues: number;
          operable_issues: number;
          understandable_issues: number;
          robust_issues: number;
          error_message: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id?: string | null;
          input_type: 'url' | 'html' | 'snippet';
          input_value: string;
          url?: string | null;
          suspected_issue?: string | null;
          status?: 'queued' | 'analyzing' | 'complete' | 'failed';
          ai_model?: string | null;
          total_issues?: number;
          critical_issues?: number;
          serious_issues?: number;
          moderate_issues?: number;
          minor_issues?: number;
          perceivable_issues?: number;
          operable_issues?: number;
          understandable_issues?: number;
          robust_issues?: number;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string | null;
          input_type?: 'url' | 'html' | 'snippet';
          input_value?: string;
          url?: string | null;
          suspected_issue?: string | null;
          status?: 'queued' | 'analyzing' | 'complete' | 'failed';
          ai_model?: string | null;
          total_issues?: number;
          critical_issues?: number;
          serious_issues?: number;
          moderate_issues?: number;
          minor_issues?: number;
          perceivable_issues?: number;
          operable_issues?: number;
          understandable_issues?: number;
          robust_issues?: number;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
      };
      issues: {
        Row: {
          id: string;
          audit_id: string;
          wcag_criterion: string;
          wcag_level: 'A' | 'AA' | 'AAA';
          wcag_principle: 'perceivable' | 'operable' | 'understandable' | 'robust';
          title: string;
          description: string;
          severity: 'critical' | 'serious' | 'moderate' | 'minor';
          source: 'axe-core' | 'ai-heuristic' | 'manual';
          confidence_score: number | null;
          element_selector: string | null;
          element_html: string | null;
          element_context: string | null;
          how_to_fix: string;
          code_example: string | null;
          wcag_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          audit_id: string;
          wcag_criterion: string;
          wcag_level: 'A' | 'AA' | 'AAA';
          wcag_principle: 'perceivable' | 'operable' | 'understandable' | 'robust';
          title: string;
          description: string;
          severity: 'critical' | 'serious' | 'moderate' | 'minor';
          source: 'axe-core' | 'ai-heuristic' | 'manual';
          confidence_score?: number | null;
          element_selector?: string | null;
          element_html?: string | null;
          element_context?: string | null;
          how_to_fix: string;
          code_example?: string | null;
          wcag_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          audit_id?: string;
          wcag_criterion?: string;
          wcag_level?: 'A' | 'AA' | 'AAA';
          wcag_principle?: 'perceivable' | 'operable' | 'understandable' | 'robust';
          title?: string;
          description?: string;
          severity?: 'critical' | 'serious' | 'moderate' | 'minor';
          source?: 'axe-core' | 'ai-heuristic' | 'manual';
          confidence_score?: number | null;
          element_selector?: string | null;
          element_html?: string | null;
          element_context?: string | null;
          how_to_fix?: string;
          code_example?: string | null;
          wcag_url?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
