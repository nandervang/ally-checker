-- Add Magenta A11y-style testing fields to issues table
-- Migration: 004_add_testing_fields
-- Description: Adds comprehensive testing guidance fields inspired by Magenta A11y

-- Add new columns for testing instructions
ALTER TABLE issues
ADD COLUMN IF NOT EXISTS how_to_reproduce TEXT,
ADD COLUMN IF NOT EXISTS keyboard_testing TEXT,
ADD COLUMN IF NOT EXISTS screen_reader_testing TEXT,
ADD COLUMN IF NOT EXISTS visual_testing TEXT,
ADD COLUMN IF NOT EXISTS expected_behavior TEXT,
ADD COLUMN IF NOT EXISTS report_text TEXT;

-- Add helpful comments
COMMENT ON COLUMN issues.how_to_reproduce IS 'Step-by-step instructions to reproduce the accessibility issue';
COMMENT ON COLUMN issues.keyboard_testing IS 'Keyboard-only interaction testing steps (Tab, Enter, Space, Arrow keys)';
COMMENT ON COLUMN issues.screen_reader_testing IS 'Screen reader testing instructions (Name, Role, State, Value)';
COMMENT ON COLUMN issues.visual_testing IS 'Visual inspection testing steps (contrast, focus indicators, spacing)';
COMMENT ON COLUMN issues.expected_behavior IS 'How it should work according to WCAG success criteria';
COMMENT ON COLUMN issues.report_text IS 'Swedish ETU-formatted accessibility report text';
