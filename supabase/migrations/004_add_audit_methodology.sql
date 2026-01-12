-- Add audit methodology tracking columns to audits table
-- These columns store metadata about how the AI conducted the audit

ALTER TABLE audits 
ADD COLUMN IF NOT EXISTS audit_methodology JSONB,
ADD COLUMN IF NOT EXISTS mcp_tools_used TEXT[],
ADD COLUMN IF NOT EXISTS sources_consulted TEXT[];

-- Add comments for documentation
COMMENT ON COLUMN audits.audit_methodology IS 'Detailed trace of audit phases, tools used per phase, and methodology';
COMMENT ON COLUMN audits.mcp_tools_used IS 'Array of MCP tool names used during audit (e.g., analyze_url, get_wcag_criterion)';
COMMENT ON COLUMN audits.sources_consulted IS 'Array of authoritative sources consulted (e.g., WCAG 2.2 Official Documentation, axe-core)';
