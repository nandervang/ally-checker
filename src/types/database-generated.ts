export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audits: {
        Row: {
          agent_trace: Json | null
          ai_model: string | null
          analysis_duration_ms: number | null
          analysis_steps: string[] | null
          audit_methodology: Json | null
          completed_at: string | null
          created_at: string
          critical_issues: number | null
          current_stage: string | null
          document_path: string | null
          document_type: string | null
          error_message: string | null
          id: string
          input_type: string
          input_value: string
          last_updated_at: string | null
          mcp_tools_used: string[] | null
          minor_issues: number | null
          moderate_issues: number | null
          operable_issues: number | null
          perceivable_issues: number | null
          progress: number | null
          robust_issues: number | null
          serious_issues: number | null
          session_id: string | null
          sources_consulted: string[] | null
          started_at: string | null
          status: string
          suspected_issue: string | null
          tools_used: string[] | null
          total_issues: number | null
          understandable_issues: number | null
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          agent_trace?: Json | null
          ai_model?: string | null
          analysis_duration_ms?: number | null
          analysis_steps?: string[] | null
          audit_methodology?: Json | null
          completed_at?: string | null
          created_at?: string
          critical_issues?: number | null
          current_stage?: string | null
          document_path?: string | null
          document_type?: string | null
          error_message?: string | null
          id?: string
          input_type: string
          input_value: string
          last_updated_at?: string | null
          mcp_tools_used?: string[] | null
          minor_issues?: number | null
          moderate_issues?: number | null
          operable_issues?: number | null
          perceivable_issues?: number | null
          progress?: number | null
          robust_issues?: number | null
          serious_issues?: number | null
          session_id?: string | null
          sources_consulted?: string[] | null
          started_at?: string | null
          status?: string
          suspected_issue?: string | null
          tools_used?: string[] | null
          total_issues?: number | null
          understandable_issues?: number | null
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          agent_trace?: Json | null
          ai_model?: string | null
          analysis_duration_ms?: number | null
          analysis_steps?: string[] | null
          audit_methodology?: Json | null
          completed_at?: string | null
          created_at?: string
          critical_issues?: number | null
          current_stage?: string | null
          document_path?: string | null
          document_type?: string | null
          error_message?: string | null
          id?: string
          input_type?: string
          input_value?: string
          last_updated_at?: string | null
          mcp_tools_used?: string[] | null
          minor_issues?: number | null
          moderate_issues?: number | null
          operable_issues?: number | null
          perceivable_issues?: number | null
          progress?: number | null
          robust_issues?: number | null
          serious_issues?: number | null
          session_id?: string | null
          sources_consulted?: string[] | null
          started_at?: string | null
          status?: string
          suspected_issue?: string | null
          tools_used?: string[] | null
          total_issues?: number | null
          understandable_issues?: number | null
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audits_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_issues: {
        Row: {
          added_at: string | null
          collection_id: string
          issue_id: string
        }
        Insert: {
          added_at?: string | null
          collection_id: string
          issue_id: string
        }
        Update: {
          added_at?: string | null
          collection_id?: string
          issue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_issues_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections_with_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_issues_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "issue_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_issues_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_collections: {
        Row: {
          audit_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audit_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audit_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_collections_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          audit_id: string
          code_example: string | null
          confidence_score: number | null
          created_at: string
          description: string
          element_context: string | null
          element_html: string | null
          element_selector: string | null
          en_301_549_ref: string | null
          en301549_chapter: string | null
          expected_behavior: string | null
          fix_priority: string | null
          how_to_fix: string
          how_to_reproduce: string | null
          id: string
          keyboard_testing: string | null
          report_text: string | null
          screen_reader_testing: string | null
          screenshot_data: Json | null
          screenshot_url: string | null
          severity: string
          source: string
          title: string
          user_impact: string | null
          visual_testing: string | null
          wcag_criterion: string
          wcag_explanation: string | null
          wcag_level: string
          wcag_principle: string
          wcag_url: string | null
          webbriktlinjer_url: string | null
        }
        Insert: {
          audit_id: string
          code_example?: string | null
          confidence_score?: number | null
          created_at?: string
          description: string
          element_context?: string | null
          element_html?: string | null
          element_selector?: string | null
          en_301_549_ref?: string | null
          en301549_chapter?: string | null
          expected_behavior?: string | null
          fix_priority?: string | null
          how_to_fix: string
          how_to_reproduce?: string | null
          id?: string
          keyboard_testing?: string | null
          report_text?: string | null
          screen_reader_testing?: string | null
          screenshot_data?: Json | null
          screenshot_url?: string | null
          severity: string
          source: string
          title: string
          user_impact?: string | null
          visual_testing?: string | null
          wcag_criterion: string
          wcag_explanation?: string | null
          wcag_level: string
          wcag_principle: string
          wcag_url?: string | null
          webbriktlinjer_url?: string | null
        }
        Update: {
          audit_id?: string
          code_example?: string | null
          confidence_score?: number | null
          created_at?: string
          description?: string
          element_context?: string | null
          element_html?: string | null
          element_selector?: string | null
          en_301_549_ref?: string | null
          en301549_chapter?: string | null
          expected_behavior?: string | null
          fix_priority?: string | null
          how_to_fix?: string
          how_to_reproduce?: string | null
          id?: string
          keyboard_testing?: string | null
          report_text?: string | null
          screen_reader_testing?: string | null
          screenshot_data?: Json | null
          screenshot_url?: string | null
          severity?: string
          source?: string
          title?: string
          user_impact?: string | null
          visual_testing?: string | null
          wcag_criterion?: string
          wcag_explanation?: string | null
          wcag_level?: string
          wcag_principle?: string
          wcag_url?: string | null
          webbriktlinjer_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issues_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          id: string
          last_active_at: string
          locale: string
          preferences: Json | null
          supabase_user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_active_at?: string
          locale?: string
          preferences?: Json | null
          supabase_user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_active_at?: string
          locale?: string
          preferences?: Json | null
          supabase_user_id?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          agent_mode: boolean | null
          ai_max_tokens: number | null
          ai_model: string | null
          ai_temperature: number | null
          base_color: string | null
          component_library: string | null
          created_at: string | null
          custom_mcp_servers: Json | null
          custom_system_prompt: string | null
          default_language: string | null
          default_report_template: string | null
          font: string | null
          font_size: string | null
          high_contrast: boolean | null
          icon_library: string | null
          id: string
          include_code_snippets: boolean | null
          include_screenshots: boolean | null
          menu_accent: string | null
          menu_color: string | null
          preferred_model: string | null
          radius: string | null
          reduce_motion: boolean | null
          statement_contact_email: string | null
          statement_contact_phone: string | null
          statement_default_conformance: string | null
          statement_organization_name: string | null
          style: string | null
          theme: string | null
          theme_color: string | null
          ui_density: string | null
          updated_at: string | null
          use_custom_prompt: boolean | null
          user_id: string
        }
        Insert: {
          agent_mode?: boolean | null
          ai_max_tokens?: number | null
          ai_model?: string | null
          ai_temperature?: number | null
          base_color?: string | null
          component_library?: string | null
          created_at?: string | null
          custom_mcp_servers?: Json | null
          custom_system_prompt?: string | null
          default_language?: string | null
          default_report_template?: string | null
          font?: string | null
          font_size?: string | null
          high_contrast?: boolean | null
          icon_library?: string | null
          id?: string
          include_code_snippets?: boolean | null
          include_screenshots?: boolean | null
          menu_accent?: string | null
          menu_color?: string | null
          preferred_model?: string | null
          radius?: string | null
          reduce_motion?: boolean | null
          statement_contact_email?: string | null
          statement_contact_phone?: string | null
          statement_default_conformance?: string | null
          statement_organization_name?: string | null
          style?: string | null
          theme?: string | null
          theme_color?: string | null
          ui_density?: string | null
          updated_at?: string | null
          use_custom_prompt?: boolean | null
          user_id: string
        }
        Update: {
          agent_mode?: boolean | null
          ai_max_tokens?: number | null
          ai_model?: string | null
          ai_temperature?: number | null
          base_color?: string | null
          component_library?: string | null
          created_at?: string | null
          custom_mcp_servers?: Json | null
          custom_system_prompt?: string | null
          default_language?: string | null
          default_report_template?: string | null
          font?: string | null
          font_size?: string | null
          high_contrast?: boolean | null
          icon_library?: string | null
          id?: string
          include_code_snippets?: boolean | null
          include_screenshots?: boolean | null
          menu_accent?: string | null
          menu_color?: string | null
          preferred_model?: string | null
          radius?: string | null
          reduce_motion?: boolean | null
          statement_contact_email?: string | null
          statement_contact_phone?: string | null
          statement_default_conformance?: string | null
          statement_organization_name?: string | null
          style?: string | null
          theme?: string | null
          theme_color?: string | null
          ui_density?: string | null
          updated_at?: string | null
          use_custom_prompt?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      collections_with_counts: {
        Row: {
          audit_id: string | null
          created_at: string | null
          description: string | null
          id: string | null
          issue_count: number | null
          name: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issue_collections_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cleanup_old_audits: { Args: { days_old?: number }; Returns: number }
      update_audit_counts: { Args: { audit_uuid: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
