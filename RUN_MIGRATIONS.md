# Run Database Migrations

## Current Status
Only migration `000_create_user_sessions_table` has been applied.

## Missing Migrations
You need to run migrations 001-015 in Supabase SQL Editor.

## How to Run

1. Go to your Supabase project: https://supabase.com/dashboard/project/fbfmrqmrioszslqwxwbw/sql/new

2. Run each migration file in order:

```sql
-- 001: Create audits table
-- Copy from: supabase/migrations/001_create_audits_table.sql

-- 002: Create issues table  
-- Copy from: supabase/migrations/002_create_issues_table.sql

-- 003: Alter audits add session
-- Copy from: supabase/migrations/003_alter_audits_add_session.sql

-- 004: Add audit methodology
-- Copy from: supabase/migrations/004_add_audit_methodology.sql

-- 005: Add ETU fields to issues
-- Copy from: supabase/migrations/005_add_etu_fields_to_issues.sql

-- 006: Add agent trace
-- Copy from: supabase/migrations/006_add_agent_trace.sql

-- 013: Add custom system prompt
-- Copy from: supabase/migrations/013_add_custom_system_prompt.sql

-- 014: Add ETU Swedish fields
-- Copy from: supabase/migrations/014_add_etu_swedish_fields.sql

-- 015: Add audit trace and analysis_duration_ms
-- Copy from: supabase/migrations/015_add_audit_trace.sql
```

3. Verify with:
```sql
-- Check audits table has all columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'audits' 
ORDER BY ordinal_position;

-- Should include: analysis_duration_ms, agent_trace, tools_used, analysis_steps, etc.
```

## Critical Columns to Verify

After running migrations, these columns MUST exist:

**audits table:**
- `analysis_duration_ms` (integer)
- `agent_trace` (jsonb)
- `tools_used` (text[])
- `analysis_steps` (text[])
- `audit_methodology` (jsonb)
- `mcp_tools_used` (text[])
- `sources_consulted` (text[])
- `ai_model` (text)

**issues table:**
- `keyboard_testing` (text)
- `screen_reader_testing` (text)
- `visual_testing` (text)
- `expected_behavior` (text)
- All ETU Swedish fields

## After Running Migrations

Run a new audit and check if `analysis_duration_ms` gets saved!
