-- Add system prompt configuration to user_settings
-- Allows users to customize the AI system prompt for audits

-- Add custom_system_prompt column to store user-defined prompt
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS custom_system_prompt TEXT;

-- Add use_custom_prompt flag to toggle between default and custom
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS use_custom_prompt BOOLEAN DEFAULT false;

-- Comments for documentation
COMMENT ON COLUMN user_settings.custom_system_prompt IS 'User-defined custom system prompt for AI audits (overrides default when use_custom_prompt is true)';
COMMENT ON COLUMN user_settings.use_custom_prompt IS 'Whether to use custom system prompt instead of default';
