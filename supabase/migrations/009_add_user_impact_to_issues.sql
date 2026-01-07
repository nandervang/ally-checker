-- Add user_impact field to issues table
-- This field describes how the accessibility issue affects end users

ALTER TABLE issues 
ADD COLUMN IF NOT EXISTS user_impact TEXT;

-- Add comment for documentation
COMMENT ON COLUMN issues.user_impact IS 'Description of how this accessibility issue impacts end users (screen reader users, keyboard users, users with low vision, etc.)';

-- Update existing rows with default impact based on severity
UPDATE issues 
SET user_impact = CASE 
  WHEN severity = 'critical' THEN 'This issue prevents users from accessing essential content or functionality.'
  WHEN severity = 'serious' THEN 'This issue creates significant barriers for users with disabilities.'
  WHEN severity = 'moderate' THEN 'This issue makes content harder to use for users with disabilities.'
  WHEN severity = 'minor' THEN 'This issue may cause minor inconvenience for some users.'
  ELSE 'Impact on users needs to be assessed.'
END
WHERE user_impact IS NULL;
