-- Create issues table to store individual accessibility violations
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  
  -- Issue identification
  wcag_criterion TEXT NOT NULL, -- e.g., "1.1.1", "2.4.4"
  wcag_level TEXT NOT NULL CHECK (wcag_level IN ('A', 'AA', 'AAA')),
  wcag_principle TEXT NOT NULL CHECK (wcag_principle IN ('perceivable', 'operable', 'understandable', 'robust')),
  
  -- Issue details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'serious', 'moderate', 'minor')),
  
  -- Source of detection
  source TEXT NOT NULL CHECK (source IN ('axe-core', 'ai-heuristic', 'manual')),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  -- Technical details
  element_selector TEXT, -- CSS selector or XPath
  element_html TEXT, -- HTML snippet of problematic element
  element_context TEXT, -- Surrounding HTML context
  
  -- Remediation
  how_to_fix TEXT NOT NULL,
  code_example TEXT, -- Example of corrected code
  wcag_url TEXT, -- Link to WCAG criterion documentation
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on audit_id for fast audit queries
CREATE INDEX IF NOT EXISTS idx_issues_audit_id ON issues(audit_id);

-- Create index on wcag_principle for filtering
CREATE INDEX IF NOT EXISTS idx_issues_wcag_principle ON issues(wcag_principle);

-- Create index on severity for filtering
CREATE INDEX IF NOT EXISTS idx_issues_severity ON issues(severity);

-- Create index on wcag_criterion for searching
CREATE INDEX IF NOT EXISTS idx_issues_wcag_criterion ON issues(wcag_criterion);

-- Enable Row Level Security
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see issues from their own audits
CREATE POLICY "Users can view issues from their own audits"
  ON issues
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM audits
      WHERE audits.id = issues.audit_id
      AND audits.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can only insert issues to their own audits
CREATE POLICY "Users can create issues for their own audits"
  ON issues
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM audits
      WHERE audits.id = issues.audit_id
      AND audits.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can only delete issues from their own audits
CREATE POLICY "Users can delete issues from their own audits"
  ON issues
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM audits
      WHERE audits.id = issues.audit_id
      AND audits.user_id = auth.uid()
    )
  );
