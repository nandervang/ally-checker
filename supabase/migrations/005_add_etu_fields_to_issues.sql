-- Add ETU Swedish report fields and enhanced testing fields to issues table

ALTER TABLE issues 
ADD COLUMN IF NOT EXISTS wcag_explanation TEXT,
ADD COLUMN IF NOT EXISTS how_to_reproduce TEXT,
ADD COLUMN IF NOT EXISTS user_impact TEXT,
ADD COLUMN IF NOT EXISTS fix_priority TEXT CHECK (fix_priority IN ('MÅSTE', 'BÖR', 'KAN', 'MUST', 'SHOULD', 'CAN')),
ADD COLUMN IF NOT EXISTS en_301_549_ref TEXT,
ADD COLUMN IF NOT EXISTS webbriktlinjer_url TEXT,
ADD COLUMN IF NOT EXISTS screenshot_url TEXT,
ADD COLUMN IF NOT EXISTS keyboard_testing TEXT,
ADD COLUMN IF NOT EXISTS screen_reader_testing TEXT,
ADD COLUMN IF NOT EXISTS visual_testing TEXT,
ADD COLUMN IF NOT EXISTS expected_behavior TEXT;

-- Add comments for documentation
COMMENT ON COLUMN issues.wcag_explanation IS 'Full Swedish/English explanation of WCAG criterion';
COMMENT ON COLUMN issues.how_to_reproduce IS 'Step-by-step numbered instructions to reproduce the issue';
COMMENT ON COLUMN issues.user_impact IS 'Specific consequence for users with disabilities';
COMMENT ON COLUMN issues.fix_priority IS 'Swedish: MÅSTE (must fix), BÖR (should fix), KAN (can fix). English: MUST, SHOULD, CAN';
COMMENT ON COLUMN issues.en_301_549_ref IS 'EN 301 549 reference (e.g., 9.1.4.4 for Resize Text)';
COMMENT ON COLUMN issues.webbriktlinjer_url IS 'Swedish Webbriktlinjer link';
COMMENT ON COLUMN issues.screenshot_url IS 'Screenshot URL or base64 data showing the issue';
COMMENT ON COLUMN issues.keyboard_testing IS 'Keyboard-only interaction testing instructions (Tab, Enter, Space, Arrow keys, Esc)';
COMMENT ON COLUMN issues.screen_reader_testing IS 'Screen reader testing instructions (Name, Role, State, Value, Group)';
COMMENT ON COLUMN issues.visual_testing IS 'Visual inspection testing (contrast, focus indicator, spacing, zoom)';
COMMENT ON COLUMN issues.expected_behavior IS 'How it should work according to WCAG success criteria';
