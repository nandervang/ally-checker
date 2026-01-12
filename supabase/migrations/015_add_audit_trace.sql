-- Add audit trace/methodology fields to audits table
-- Tracks which MCP tools were used and how the audit was conducted

ALTER TABLE audits
  ADD COLUMN IF NOT EXISTS audit_methodology JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS mcp_tools_used TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sources_consulted TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS analysis_duration_ms INTEGER;

COMMENT ON COLUMN audits.audit_methodology IS 'Detailed trace of audit process: phases completed, tools called, sources referenced';
COMMENT ON COLUMN audits.mcp_tools_used IS 'Array of MCP tool names used during audit (e.g., get_wcag_criterion, analyze_html)';
COMMENT ON COLUMN audits.sources_consulted IS 'Array of authoritative sources consulted (WCAG docs, WAI-ARIA, Magenta A11y)';
COMMENT ON COLUMN audits.analysis_duration_ms IS 'Total duration of AI analysis in milliseconds';

-- Create index for filtering by tools used
CREATE INDEX IF NOT EXISTS idx_audits_mcp_tools ON audits USING GIN (mcp_tools_used);
