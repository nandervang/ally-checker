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
| **how_to_reproduce** | text | NULLABLE | **[NEW]** Step-by-step instructions to reproduce the issue (Magenta A11y-style) |
| **keyboard_testing** | text | NULLABLE | **[NEW]** Keyboard navigation testing instructions (Tab, Enter, Space, Arrow keys) |
| **screen_reader_testing** | text | NULLABLE | **[NEW]** Screen reader testing guidance (Name, Role, State, Value) |
| **visual_testing** | text | NULLABLE | **[NEW]** Visual inspection testing steps (contrast, focus indicators, spacing) |
| **expected_behavior** | text | NULLABLE | **[NEW]** How the element should work according to WCAG success criteria |
| **report_text** | text | NULLABLE | **[NEW]** Complete formatted accessibility report (template-based: ETU Swedish, WCAG International, VPAT US, Simple, Technical) |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Issue detection timestamp |

**Validation Rules**:
- `wcag_principle` must be one of: 'Perceivable', 'Operable', 'Understandable', 'Robust'
- `success_criterion` must match pattern: '\d\.\d\.\d' (e.g., '1.4.3')
- `severity` must be one of: 'critical', 'serious', 'moderate', 'minor'
- `detection_source` must be one of: 'axe-core', 'ai-heuristic'
- `impact` must be one of: 'user', 'developer', 'legal' when NOT NULL
- `element_snippet` truncated to 500 characters max
- `description` and `remediation` must be non-empty strings
- **NEW**: Testing fields (`how_to_reproduce`, `keyboard_testing`, `screen_reader_testing`, `visual_testing`, `expected_behavior`) follow Magenta A11y format
- **NEW**: `report_text` format determined by user's `defaultReportTemplate` setting (etu-swedish, wcag-international, vpat-us, simple, technical)

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

Automated functions maintain data integrity and implement business logic at the database level.

### update_audit_counts(audit_uuid UUID)

**Purpose**: Recalculates all issue statistics for a specific audit.  
**Trigger**: Automatically called when issues are inserted, updated, or deleted.  
**Location**: Migration 012_add_database_functions.sql

**Function Signature**:
```sql
CREATE OR REPLACE FUNCTION update_audit_counts(audit_uuid UUID)
RETURNS void
LANGUAGE plpgsql
```

**What it does**:
- Counts total issues by severity (critical, serious, moderate, minor)
- Counts issues by WCAG principle (perceivable, operable, understandable, robust)
- Updates all count columns in the audits table
- Sets updated_at timestamp

**Trigger Configuration**:
```sql
CREATE TRIGGER update_audit_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION update_audit_counts_trigger_fn();
```

**Example Usage**:
```sql
-- Manual call (usually not needed, trigger handles it)
SELECT update_audit_counts('audit-id-here');
```

**Test Results** (from test-db-functions.sql):
- ✅ Trigger auto-updates counts on INSERT
- ✅ Counts update correctly on DELETE
- ✅ Manual function call works
- ✅ Handles all severity levels
- ✅ Handles all WCAG principles

---

### cleanup_old_audits(days_old INTEGER DEFAULT 90)

**Purpose**: Deletes audits older than specified days (default 90 for GDPR compliance).  
**Returns**: INTEGER (count of deleted audits)  
**Location**: Migration 012_add_database_functions.sql

**Function Signature**:
```sql
CREATE OR REPLACE FUNCTION cleanup_old_audits(days_old INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
```

**What it does**:
- Deletes audits where created_at < NOW() - interval
- CASCADE DELETE automatically removes related issues
- Logs count of deleted audits via RAISE NOTICE
- Returns count for external tracking

**Example Usage**:
```sql
-- Delete audits older than 90 days (default)
SELECT cleanup_old_audits();

-- Delete audits older than 30 days
SELECT cleanup_old_audits(30);

-- Dry run: check how many would be deleted
SELECT COUNT(*) FROM audits 
WHERE created_at < NOW() - INTERVAL '90 days';
```

**Scheduling** (recommended):
```bash
# Cron job to run daily at 2 AM
0 2 * * * psql $DATABASE_URL -c "SELECT cleanup_old_audits(90);"
```

**Test Results** (from test-db-functions.sql):
- ✅ Correctly identifies old audits
- ✅ Deletes audits older than threshold
- ✅ Preserves audits within threshold
- ✅ Returns accurate count
- ✅ CASCADE deletes related issues

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
          how_to_reproduce: string | null
          keyboard_testing: string | null
          screen_reader_testing: string | null
          visual_testing: string | null
          expected_behavior: string | null
          report_text: string | null
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
          how_to_reproduce?: string | null
          keyboard_testing?: string | null
          screen_reader_testing?: string | null
          visual_testing?: string | null
          expected_behavior?: string | null
          report_text?: string | null
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

## Report Template System

**Feature**: Multi-Template Accessibility Reports  
**Added**: January 2026

### Overview

The system supports 5 professional report templates to serve different audiences and compliance requirements. Each issue's `report_text` field is generated using the user's selected `defaultReportTemplate` setting.

### Available Templates

| Template ID | Name | Language | Target Audience | Standards |
|------------|------|----------|----------------|-----------|
| `etu-swedish` | ETU Swedish | Swedish | Swedish public sector organizations | WCAG 2.1, EN 301 549, Webbriktlinjer |
| `wcag-international` | WCAG International | English | International projects (default) | WCAG 2.1/2.2, EN 301 549 |
| `vpat-us` | VPAT US | English | US federal contractors | Section 508, WCAG 2.1 |
| `simple` | Simple | English | Agile development teams | WCAG 2.1 (minimal) |
| `technical` | Technical | English | Technical analysis teams | WCAG 2.1, ARIA specifications |

### Template Structure

**ETU Swedish**:
```
## [WCAG X.X.X] [Title in Swedish]
Kategori: [Uppfattbar/Hanterbar/Begriplig/Robust]
WCAG-kriterium: [Criterion]
EN 301 549 Kapitel: [References]
Webbriktlinjer: [Link]
Beskrivning av felet: [Description]
Hur man återskapar felet: [Steps]
Konsekvens för användaren: [User impact]
Åtgärda:
  Bör: [Primary fix]
  Kan: [Optional fix]
Kodexempel: [Code]
Relaterade krav: [Standards]
```

**WCAG International** (Default):
```
## [WCAG X.X.X] [Title]
WCAG Success Criterion: [X.X.X Name (Level A/AA/AAA)]
WCAG Principle: [Perceivable/Operable/Understandable/Robust]
Severity: [Critical/Serious/Moderate/Minor]
Issue Description: [Description]
How to Reproduce: [Steps]
User Impact: [Impact on users with disabilities]
Remediation:
  Required: [Must fix]
  Recommended: [Should fix]
Code Example: [Code]
WCAG Resources: [Links]
```

**VPAT US**:
```
## [WCAG X.X.X] - [Title]
Section 508 Reference: [Reference]
Conformance Level: [Does Not Support/Partially Supports/Supports]
Issue Summary: [Brief description]
Steps to Reproduce: [Steps]
Impact on Users with Disabilities: [Impact]
Remediation Strategy:
  Priority: [High/Medium/Low]
  Effort: [Small/Medium/Large]
  Action Items: [List]
Conformant Code Example: [Code]
Applicable Standards: [Section 508, WCAG, EN 301 549]
```

**Simple**:
```
## [Title]
Problem: [One sentence]
WCAG: [X.X.X] | Severity: [Level]
What's Wrong: [2-3 sentences]
How to Fix: [Direct steps]
Code:
  ❌ Before: [Broken code]
  ✅ After: [Fixed code]
Reference: [WCAG link]
```

**Technical**:
```
## [WCAG X.X.X] [Technical Title]
Violation: [Technical description]
WCAG Criterion: [X.X.X Name (Level)]
Detection Method: [Automated/Manual/Heuristic]
Affected Elements:
  Selector: [CSS selector]
  DOM Path: [Path]
Assistive Technology Impact:
  Screen Readers: [Impact]
  Keyboard Navigation: [Impact]
  Voice Control: [Impact]
Implementation Requirements:
  Must: [Required changes]
  Should: [Recommended changes]
Code Implementation:
  Current: [Problematic code]
  Compliant: [Fixed code]
Testing Criteria: [Checklist]
Technical References: [ARIA, WCAG techniques]
```

### User Settings

Report template configured in `user_sessions.preferences`:

```json
{
  "defaultReportTemplate": "wcag-international"
}
```

Or in user settings table (for authenticated users):

```sql
UPDATE user_settings 
SET default_report_template = 'etu-swedish' 
WHERE user_id = ?;
```

### AI Integration

The AI agent (Gemini 2.5 Flash) receives template selection in system prompt:

```typescript
const template = userSettings.defaultReportTemplate || 'wcag-international';
const prompt = `Generate report_text using ${template} template format...`;
```

### UI Display

Report text displayed in issue cards with:
- Copy button ("Kopiera" for Swedish, "Copy" for English)
- Monospace font for code examples
- Syntax highlighting (future enhancement)

---

## Row-Level Security (RLS)

### Overview

All tables in the database have Row-Level Security enabled to prevent unauthorized data access. RLS policies enforce data isolation between users and allow the service role to bypass restrictions for backend operations.

### Enabled Tables

- `user_sessions` - User session and preference data
- `audits` - Accessibility audit records
- `issues` - Accessibility issues from audits
- `user_settings` - User configuration (authenticated users only)
- `issue_collections` - Saved issue collections
- `collection_issues` - Issues within collections

### Policy Structure

Each table implements four standard policies:

1. **SELECT**: Users can view only their own data
2. **INSERT**: Users can create records linked to themselves
3. **UPDATE**: Users can modify only their own records
4. **DELETE**: Users can delete only their own records

### User Identification

Policies use two methods to identify the current user:

1. **Authenticated users**: `auth.uid()` returns the user's UUID from JWT
2. **Anonymous users**: `supabase_user_id IS NULL` allows anonymous sessions

### Example Policies

**user_sessions**:
```sql
-- SELECT policy
CREATE POLICY "Users can view their own sessions"
ON user_sessions FOR SELECT
USING (
  supabase_user_id = auth.uid() OR
  supabase_user_id IS NULL
);
```

**audits**:
```sql
-- SELECT policy
CREATE POLICY "Users can view their own audits"
ON audits FOR SELECT
USING (user_id = auth.uid());

-- INSERT policy
CREATE POLICY "Users can create their own audits"
ON audits FOR INSERT
WITH CHECK (user_id = auth.uid());
```

**issues**:
```sql
-- SELECT policy (via audit ownership)
CREATE POLICY "Users can view issues from their own audits"
ON issues FOR SELECT
USING (
  audit_id IN (
    SELECT id FROM audits WHERE user_id = auth.uid()
  )
);
```

### Service Role Bypass

Backend Netlify Functions use the `SUPABASE_SERVICE_ROLE_KEY` which bypasses all RLS policies. This allows:

- Creating audits on behalf of users
- Inserting issues for audits
- Aggregating statistics across users
- Administrative operations

### Testing

RLS policies are tested with multiple user contexts to verify:

- ✅ Users can access their own data
- ✅ Users cannot access other users' data
- ✅ Anonymous users can create sessions
- ✅ Service role can bypass restrictions

See `/test-rls.sql` for test script.

### Migration History

- **000**: user_sessions RLS enabled with policies
- **001**: audits RLS enabled with policies
- **002**: issues RLS enabled with policies
- **007**: issue_collections and collection_issues RLS enabled
- **008**: user_settings RLS enabled with policies

---

## Security Notes

- All user data isolated via RLS policies (session-based for anonymous, user-based for authenticated)
- `input_content` may contain sensitive HTML - ensure proper RLS enforcement
- API keys and service role keys never exposed to frontend
- Audit retention policy (90 days) complies with GDPR data minimization
