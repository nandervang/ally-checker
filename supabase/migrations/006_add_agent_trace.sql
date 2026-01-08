-- Add audit trail columns to track AI agent's work process
ALTER TABLE audits
ADD COLUMN IF NOT EXISTS agent_trace JSONB,
ADD COLUMN IF NOT EXISTS tools_used TEXT[],
ADD COLUMN IF NOT EXISTS analysis_steps TEXT[];

-- Add index for querying by tools used
CREATE INDEX IF NOT EXISTS idx_audits_tools_used ON audits USING GIN(tools_used);

-- Add comments
COMMENT ON COLUMN audits.agent_trace IS 'JSON trace of AI agent work: tool calls, reasoning, sources consulted';
COMMENT ON COLUMN audits.tools_used IS 'Array of MCP tools used during audit (e.g., fetch_url, analyze_html, audit_pdf)';
COMMENT ON COLUMN audits.analysis_steps IS 'Step-by-step procedure the agent followed';
