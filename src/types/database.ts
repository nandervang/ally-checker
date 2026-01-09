// Database types - auto-generated from Supabase schema
// Generated using: supabase gen types typescript --local > src/types/database-generated.ts
// Last updated: 2026-01-08

export * from './database-generated';
export type { Database } from './database-generated';

// Re-export commonly used types for convenience
import type { Database } from './database-generated';

export type UserSession = Database['public']['Tables']['user_sessions']['Row'];
export type UserSessionInsert = Database['public']['Tables']['user_sessions']['Insert'];
export type UserSessionUpdate = Database['public']['Tables']['user_sessions']['Update'];

export type Audit = Database['public']['Tables']['audits']['Row'];
export type AuditInsert = Database['public']['Tables']['audits']['Insert'];
export type AuditUpdate = Database['public']['Tables']['audits']['Update'];

export type Issue = Database['public']['Tables']['issues']['Row'];
export type IssueInsert = Database['public']['Tables']['issues']['Insert'];
export type IssueUpdate = Database['public']['Tables']['issues']['Update'];

export type UserSettings = Database['public']['Tables']['user_settings']['Row'];
export type UserSettingsInsert = Database['public']['Tables']['user_settings']['Insert'];
export type UserSettingsUpdate = Database['public']['Tables']['user_settings']['Update'];

export type IssueCollection = Database['public']['Tables']['issue_collections']['Row'];
export type IssueCollectionInsert = Database['public']['Tables']['issue_collections']['Insert'];
export type IssueCollectionUpdate = Database['public']['Tables']['issue_collections']['Update'];

export type CollectionIssue = Database['public']['Tables']['collection_issues']['Row'];
export type CollectionIssueInsert = Database['public']['Tables']['collection_issues']['Insert'];
export type CollectionIssueUpdate = Database['public']['Tables']['collection_issues']['Update'];
