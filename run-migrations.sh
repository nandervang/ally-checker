#!/bin/bash
# Run remaining SQL migrations that weren't applied

echo "Running user_sessions migration..."
supabase db psql < supabase/migrations/000_create_user_sessions_table.sql

echo "Running audits session_id migration..."
supabase db psql < supabase/migrations/003_alter_audits_add_session.sql

echo "Done! Checking tables..."
supabase db psql -c "\dt"
