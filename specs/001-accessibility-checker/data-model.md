# Data Model

**Feature**: Accessibility Checker Application  
**Branch**: 001-accessibility-checker  
**Date**: 2025-12-30

## Overview

This document defines the data entities, relationships, and validation rules for the Accessibility Checker application. The model is implemented using Supabase PostgreSQL with Row-Level Security (RLS) for multi-tenant isolation.

## Entity Relationship Diagram

```
┌─────────────────┐
│  user_sessions  │
│─────────────────│
│ id (uuid)       │──┐
│ created_at      │  │
│ preferences     │  │
│ locale          │  │
└─────────────────┘  │
                     │ 1:N
                     │
                 ┌───▼──────────┐
                 │    audits    │
                 │──────────────│
                 │ id (uuid)    │──┐
                 │ session_id   │  │
                 │ input_type   │  │
                 │ input_content│  │
                 │ url          │  │
                 │ suspected_iss│  │
                 │ status       │  │
                 │ created_at   │  │
                 │ completed_at │  │
                 │ total_issues │  │
                 └──────────────┘  │
                                   │ 1:N
                                   │
                              ┌────▼────────────┐
                              │     issues      │
                              │─────────────────│
                              │ id (uuid)       │
                              │ audit_id        │
                              │ wcag_principle  │
                              │ success_criteri │
                              │ severity        │
                              │ description     │
                              │ code_location   │
                              │ element_snippet │
                              │ detection_sourc │
                              │ remediation     │
                              │ created_at      │
                              └─────────────────┘
```

## Entities

### 1. user_sessions

Represents an anonymous or authenticated user's session and preferences.

**Purpose**: Track user preferences, locale settings, and audit history without requiring full authentication. Supports both anonymous (localStorage-based) and authenticated users.

**Attributes**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique session identifier |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Session creation timestamp |
| last_active_at | timestamptz | NOT NULL, DEFAULT now() | Last activity timestamp |
| preferences | jsonb | DEFAULT '{}' | User preferences (theme, language, etc.) |
| locale | varchar(10) | NOT NULL, DEFAULT 'sv-SE' | User's preferred locale (sv-SE, en-US) |
| supabase_user_id | uuid | NULLABLE, FOREIGN KEY → auth.users(id) | Link to authenticated user (if logged in) |

**Validation Rules**:
- `locale` must be one of: 'sv-SE', 'en-US'
- `preferences` must be valid JSON object
- `last_active_at` updated on any audit creation

**Indexes**:
- `idx_sessions_supabase_user` on `supabase_user_id`
- `idx_sessions_last_active` on `last_active_at` (for cleanup)

**RLS Policies**:
- Anonymous users can INSERT/UPDATE/SELECT own session via `id` match
- Authenticated users can SELECT all own sessions via `supabase_user_id`

---

### 2. audits

Represents a single accessibility audit request and its metadata.

**Purpose**: Store audit input, status, and summary statistics. Central entity linking user sessions to detailed issue findings.

**Attributes**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique audit identifier |
| session_id | uuid | NOT NULL, FOREIGN KEY → user_sessions(id) | Owning session |
| input_type | varchar(20) | NOT NULL | Type of input: 'url', 'html_full', 'html_snippet', 'issue_only' |
| input_content | text | NULLABLE | HTML content (NULL for URLs) |
| url | text | NULLABLE | Source URL (NULL for HTML input) |
| suspected_issue | text | NULLABLE | User-described suspected accessibility concern |
| status | varchar(20) | NOT NULL, DEFAULT 'pending' | Audit status: 'pending', 'analyzing', 'completed', 'failed' |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Audit request timestamp |
| completed_at | timestamptz | NULLABLE | Audit completion timestamp |
| total_issues | integer | DEFAULT 0 | Total number of issues found |
| perceivable_count | integer | DEFAULT 0 | Issues in Perceivable principle |
| operable_count | integer | DEFAULT 0 | Issues in Operable principle |
| understandable_count | integer | DEFAULT 0 | Issues in Understandable principle |
| robust_count | integer | DEFAULT 0 | Issues in Robust principle |
| ai_investigation | jsonb | NULLABLE | AI analysis of suspected issue |
| error_message | text | NULLABLE | Error details if status='failed' |

**Validation Rules**:
- `input_type` must be one of: 'url', 'html_full', 'html_snippet', 'issue_only'
- `status` must be one of: 'pending', 'analyzing', 'completed', 'failed'
- If `input_type='url'`, then `url` must be NOT NULL and valid HTTP(S) URL
- If `input_type` IN ('html_full', 'html_snippet'), then `input_content` must be NOT NULL
- If `input_type='issue_only'`, then `suspected_issue` must be NOT NULL
- `total_issues` = `perceivable_count + operable_count + understandable_count + robust_count`
- `completed_at` must be >= `created_at` when NOT NULL

**Indexes**:
- `idx_audits_session_id` on `session_id`
- `idx_audits_status` on `status` (for querying pending audits)
- `idx_audits_created_at` on `created_at DESC` (for history)
- `idx_audits_url` on `url` (for deduplication checks)

**RLS Policies**:
- Users can INSERT audits for own session_id
- Users can SELECT audits where session_id belongs to them
- Users can UPDATE audits they own (for status changes)
- Auto-delete audits older than 90 days (via scheduled function)

---

### 3. issues

Represents individual accessibility violations or warnings found during an audit.

**Purpose**: Store detailed information about each accessibility issue for reporting and remediation guidance.

**Attributes**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique issue identifier |
| audit_id | uuid | NOT NULL, FOREIGN KEY → audits(id) ON DELETE CASCADE | Parent audit |
| wcag_principle | varchar(20) | NOT NULL | WCAG principle: 'Perceivable', 'Operable', 'Understandable', 'Robust' |
| success_criterion | varchar(10) | NOT NULL | WCAG success criterion (e.g., '1.4.3', '2.1.1') |
| severity | varchar(20) | NOT NULL | Issue severity: 'critical', 'serious', 'moderate', 'minor' |
| description | text | NOT NULL | Human-readable issue description |
| code_location | text | NULLABLE | Location in HTML (CSS selector or line number) |
| element_snippet | text | NULLABLE | Affected HTML element (truncated to 500 chars) |
| detection_source | varchar(20) | NOT NULL | Source: 'axe-core' or 'ai-heuristic' |
| remediation | text | NOT NULL | Suggested fix/remediation steps |
| wcag_reference_url | text | NULLABLE | Link to WCAG documentation (from WCAG MCP) |
| impact | varchar(20) | NULLABLE | Impact level: 'user', 'developer', 'legal' |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Issue detection timestamp |

**Validation Rules**:
- `wcag_principle` must be one of: 'Perceivable', 'Operable', 'Understandable', 'Robust'
- `success_criterion` must match pattern: '\d\.\d\.\d' (e.g., '1.4.3')
- `severity` must be one of: 'critical', 'serious', 'moderate', 'minor'
- `detection_source` must be one of: 'axe-core', 'ai-heuristic'
- `impact` must be one of: 'user', 'developer', 'legal' when NOT NULL
- `element_snippet` truncated to 500 characters max
- `description` and `remediation` must be non-empty strings

**Indexes**:
- `idx_issues_audit_id` on `audit_id`
- `idx_issues_wcag_principle` on `wcag_principle` (for grouping)
- `idx_issues_severity` on `severity` (for filtering)
- `idx_issues_success_criterion` on `success_criterion` (for analytics)

**RLS Policies**:
- Users can SELECT issues where audit_id belongs to their session
- System can INSERT/UPDATE/DELETE issues (via service role key)

---

## State Transitions

### Audit Status Lifecycle

```
pending → analyzing → completed
              ↓
            failed
```

**Transition Rules**:
1. `pending` → `analyzing`: When analysis starts (axe-core begins execution)
2. `analyzing` → `completed`: When analysis finishes successfully and all issues inserted
3. `analyzing` → `failed`: When analysis encounters error (invalid HTML, fetch failure, timeout)
4. No transitions from `completed` or `failed` (terminal states)

**Triggers**:
- On transition to `completed`: Set `completed_at = now()`, update issue counts
- On transition to `failed`: Set `error_message`, `completed_at = now()`

---

## Data Access Patterns

### Common Queries

#### 1. Get Recent Audits for User
```sql
SELECT a.id, a.input_type, a.url, a.created_at, a.total_issues, a.status
FROM audits a
WHERE a.session_id = ?
ORDER BY a.created_at DESC
LIMIT 20;
```

#### 2. Get Audit Results with Issues
```sql
SELECT 
  a.id, a.input_type, a.url, a.suspected_issue, a.total_issues,
  i.id, i.wcag_principle, i.success_criterion, i.severity, 
  i.description, i.remediation
FROM audits a
LEFT JOIN issues i ON i.audit_id = a.id
WHERE a.id = ?
ORDER BY 
  CASE i.severity 
    WHEN 'critical' THEN 1
    WHEN 'serious' THEN 2
    WHEN 'moderate' THEN 3
    WHEN 'minor' THEN 4
  END,
  i.wcag_principle;
```

#### 3. Get Issues by WCAG Principle
```sql
SELECT wcag_principle, COUNT(*) as count, 
       AVG(CASE severity 
         WHEN 'critical' THEN 4
         WHEN 'serious' THEN 3
         WHEN 'moderate' THEN 2
         WHEN 'minor' THEN 1
       END) as avg_severity
FROM issues
WHERE audit_id = ?
GROUP BY wcag_principle;
```

#### 4. Get AI Investigation Results
```sql
SELECT suspected_issue, ai_investigation
FROM audits
WHERE id = ? AND ai_investigation IS NOT NULL;
```

---

## Database Functions

### update_audit_counts()

**Purpose**: Trigger function to automatically update issue counts on audits table when issues are inserted/updated/deleted.

```sql
CREATE OR REPLACE FUNCTION update_audit_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE audits
  SET 
    total_issues = (
      SELECT COUNT(*) FROM issues WHERE audit_id = NEW.audit_id
    ),
    perceivable_count = (
      SELECT COUNT(*) FROM issues 
      WHERE audit_id = NEW.audit_id AND wcag_principle = 'Perceivable'
    ),
    operable_count = (
      SELECT COUNT(*) FROM issues 
      WHERE audit_id = NEW.audit_id AND wcag_principle = 'Operable'
    ),
    understandable_count = (
      SELECT COUNT(*) FROM issues 
      WHERE audit_id = NEW.audit_id AND wcag_principle = 'Understandable'
    ),
    robust_count = (
      SELECT COUNT(*) FROM issues 
      WHERE audit_id = NEW.audit_id AND wcag_principle = 'Robust'
    )
  WHERE id = NEW.audit_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_audit_counts
AFTER INSERT OR UPDATE OR DELETE ON issues
FOR EACH ROW EXECUTE FUNCTION update_audit_counts();
```

### cleanup_old_audits()

**Purpose**: Scheduled function to delete audits (and cascade to issues) older than 90 days.

```sql
CREATE OR REPLACE FUNCTION cleanup_old_audits()
RETURNS void AS $$
BEGIN
  DELETE FROM audits
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
```

---

## Migration Strategy

### Initial Schema (Migration 001)
1. Enable UUID extension: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
2. Create `user_sessions` table
3. Create `audits` table with foreign key to `user_sessions`
4. Create `issues` table with foreign key to `audits`
5. Create indexes
6. Enable RLS on all tables
7. Create RLS policies
8. Create triggers and functions

### Seed Data
- No seed data required
- Test data generated via frontend for development

---

## TypeScript Types (Generated)

```typescript
// Generated via: supabase gen types typescript

export interface Database {
  public: {
    Tables: {
      user_sessions: {
        Row: {
          id: string
          created_at: string
          last_active_at: string
          preferences: Json
          locale: string
          supabase_user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          last_active_at?: string
          preferences?: Json
          locale?: string
          supabase_user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          last_active_at?: string
          preferences?: Json
          locale?: string
          supabase_user_id?: string | null
        }
      }
      audits: {
        Row: {
          id: string
          session_id: string
          input_type: 'url' | 'html_full' | 'html_snippet' | 'issue_only'
          input_content: string | null
          url: string | null
          suspected_issue: string | null
          status: 'pending' | 'analyzing' | 'completed' | 'failed'
          created_at: string
          completed_at: string | null
          total_issues: number
          perceivable_count: number
          operable_count: number
          understandable_count: number
          robust_count: number
          ai_investigation: Json | null
          error_message: string | null
        }
        Insert: {
          id?: string
          session_id: string
          input_type: 'url' | 'html_full' | 'html_snippet' | 'issue_only'
          input_content?: string | null
          url?: string | null
          suspected_issue?: string | null
          status?: 'pending' | 'analyzing' | 'completed' | 'failed'
          created_at?: string
          completed_at?: string | null
          total_issues?: number
          perceivable_count?: number
          operable_count?: number
          understandable_count?: number
          robust_count?: number
          ai_investigation?: Json | null
          error_message?: string | null
        }
        Update: {
          // Same as Insert but all optional
        }
      }
      issues: {
        Row: {
          id: string
          audit_id: string
          wcag_principle: 'Perceivable' | 'Operable' | 'Understandable' | 'Robust'
          success_criterion: string
          severity: 'critical' | 'serious' | 'moderate' | 'minor'
          description: string
          code_location: string | null
          element_snippet: string | null
          detection_source: 'axe-core' | 'ai-heuristic'
          remediation: string
          wcag_reference_url: string | null
          impact: 'user' | 'developer' | 'legal' | null
          created_at: string
        }
        Insert: {
          id?: string
          audit_id: string
          wcag_principle: 'Perceivable' | 'Operable' | 'Understandable' | 'Robust'
          success_criterion: string
          severity: 'critical' | 'serious' | 'moderate' | 'minor'
          description: string
          code_location?: string | null
          element_snippet?: string | null
          detection_source: 'axe-core' | 'ai-heuristic'
          remediation: string
          wcag_reference_url?: string | null
          impact?: 'user' | 'developer' | 'legal' | null
          created_at?: string
        }
        Update: {
          // Same as Insert but all optional
        }
      }
    }
  }
}
```

---

## Performance Considerations

- **Partitioning**: Consider partitioning `audits` and `issues` by `created_at` if volume exceeds 1M rows
- **Archiving**: Audits older than 90 days moved to cold storage (separate table) before deletion
- **Indexes**: Monitor query performance and add composite indexes as needed
- **Connection Pooling**: Supabase handles this automatically (PgBouncer)

---

## Security Notes

- All user data isolated via RLS policies (session-based for anonymous, user-based for authenticated)
- `input_content` may contain sensitive HTML - ensure proper RLS enforcement
- API keys and service role keys never exposed to frontend
- Audit retention policy (90 days) complies with GDPR data minimization
