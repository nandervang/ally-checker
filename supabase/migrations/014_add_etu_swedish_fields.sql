-- Add remaining ETU-specific fields for professional Swedish accessibility reports
-- Complements existing testing fields with Swedish standards references

ALTER TABLE issues
ADD COLUMN IF NOT EXISTS wcag_explanation TEXT,
ADD COLUMN IF NOT EXISTS fix_priority VARCHAR(20) CHECK (fix_priority IN ('MÅSTE', 'BÖR', 'KAN', 'MUST', 'SHOULD', 'CAN')),
ADD COLUMN IF NOT EXISTS en_301_549_ref VARCHAR(50),
ADD COLUMN IF NOT EXISTS webbriktlinjer_url TEXT,
ADD COLUMN IF NOT EXISTS screenshot_url TEXT;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_issues_fix_priority ON issues(fix_priority);

-- Add comments
COMMENT ON COLUMN issues.wcag_explanation IS 'Full explanation of the WCAG criterion (Swedish/English), e.g., "Text ska kunna förstoras upp till 200%..."';
COMMENT ON COLUMN issues.fix_priority IS 'ETU Swedish fix priority: MÅSTE (critical/must fix immediately), BÖR (should fix soon), KAN (could fix when time allows)';
COMMENT ON COLUMN issues.en_301_549_ref IS 'EN 301 549 European standard reference (e.g., "9.1.4.4" for Resize Text)';
COMMENT ON COLUMN issues.webbriktlinjer_url IS 'Link to relevant Webbriktlinjer (Swedish Web Guidelines), e.g., https://webbriktlinjer.se/riktlinjer/96-...';
COMMENT ON COLUMN issues.screenshot_url IS 'URL to screenshot image showing the accessibility issue (can be base64 data URL or external URL)';
