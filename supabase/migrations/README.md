# Database Setup

## Running Migrations

To set up the database schema in your Supabase project, run these SQL migrations in order from the Supabase Dashboard SQL Editor:

1. Go to your Supabase project: https://fbfmrqmrioszslqwxwbw.supabase.co
2. Navigate to SQL Editor
3. Run each migration file in order:

### Migration 000: Create User Sessions Table
Copy and paste the contents of `000_create_user_sessions_table.sql` and execute.

This creates:
- `user_sessions` table for session management and user preferences
- Supports both anonymous and authenticated users
- Stores locale (sv-SE/en-US) and preferences (JSONB)
- Auto-updating `last_active_at` timestamp
- RLS policies for user-specific access

### Migration 001: Create Audits Table
Copy and paste the contents of `001_create_audits_table.sql` and execute.

This creates:
- `audits` table with user-specific audit sessions
- Links to both `auth.users` and `user_sessions`
- Row Level Security (RLS) policies ensuring users only see their own data
- Indexes for fast queries
- Auto-updating `updated_at` timestamp

### Migration 002: Create Issues Table  
Copy and paste the contents of `002_create_issues_table.sql` and execute.

This creates:
- `issues` table for individual accessibility violations
- Foreign key relationship to `audits` table
- RLS policies inheriting user access from audits
- Indexes for filtering and searching

## Row Level Security (RLS)

All tables have RLS enabled with policies that ensure:
- ✅ Users can only see their own audits and issues
- ✅ Users can only create audits/issues for themselves
- ✅ Users can only update/delete their own data
- ❌ No user can access another user's data

## Schema Overview

### user_sessions table
Stores user sessions and preferences with:
- User ID linking (authenticated or anonymous)
- Locale preferences (sv-SE, en-US)
- JSONB preferences object
- Activity timestamps

### audits table
Stores accessibility audit sessions with:
- Input information (URL, HTML, snippet)
- Optional suspected issue description
- Link to user_sessions
- Analysis status (queued → analyzing → complete/failed)
- Results summary (issue counts by severity and WCAG principle)
- Timestamps and metadata

### issues table
Stores individual accessibility violations with:
- WCAG criterion, level, and principle
- Issue details (title, description, severity)
- Detection source (axe-core, AI, manual)
- Remediation guidance and code examples
- Element selectors and HTML context

## TypeScript Types

Database types are defined in `src/types/database.ts` and used throughout the application for type safety.
