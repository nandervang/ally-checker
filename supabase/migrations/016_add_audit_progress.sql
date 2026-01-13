
-- Add progress tracking and enhanced trace columns to audits table
ALTER TABLE public.audits 
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_stage TEXT,
ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS audit_methodology JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS agent_trace JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS mcp_tools_used JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS sources_consulted JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS analysis_steps JSONB DEFAULT '[]'::jsonb;
