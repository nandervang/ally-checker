-- =====================================================
-- User Settings Schema
-- =====================================================
-- Stores user preferences and configuration
-- Supports AI model selection, report templates, UI preferences, etc.

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- AI Configuration
  ai_model VARCHAR(50) DEFAULT 'gemini-pro',
  ai_temperature DECIMAL(3, 2) DEFAULT 0.7,
  ai_max_tokens INTEGER DEFAULT 4000,
  
  -- Report Configuration
  default_report_template VARCHAR(50) DEFAULT 'etu-standard',
  include_screenshots BOOLEAN DEFAULT true,
  include_code_snippets BOOLEAN DEFAULT true,
  
  -- Statement Configuration
  statement_organization_name VARCHAR(255),
  statement_contact_email VARCHAR(255),
  statement_contact_phone VARCHAR(50),
  statement_default_conformance VARCHAR(20) DEFAULT 'Partial',
  
  -- Localization
  default_language VARCHAR(10) DEFAULT 'en-US',
  
  -- UI Preferences
  theme VARCHAR(20) DEFAULT 'system',
  ui_density VARCHAR(20) DEFAULT 'comfortable',
  font_size VARCHAR(20) DEFAULT 'medium',
  reduce_motion BOOLEAN DEFAULT false,
  high_contrast BOOLEAN DEFAULT false,
  
  -- MCP Server Configuration (JSON array)
  custom_mcp_servers JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own settings
CREATE POLICY "Users can view own settings"
  ON user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own settings
CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own settings
CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own settings
CREATE POLICY "Users can delete own settings"
  ON user_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on every UPDATE
CREATE TRIGGER trigger_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();

-- Comments for documentation
COMMENT ON TABLE user_settings IS 'User preferences and application settings';
COMMENT ON COLUMN user_settings.ai_model IS 'Selected AI model (gemini-pro, gpt-4, claude, groq, ollama)';
COMMENT ON COLUMN user_settings.ai_temperature IS 'AI temperature setting (0.0-1.0)';
COMMENT ON COLUMN user_settings.default_report_template IS 'Default report template (etu-standard, minimal, detailed, custom)';
COMMENT ON COLUMN user_settings.default_language IS 'Default UI language (en-US, sv-SE)';
COMMENT ON COLUMN user_settings.theme IS 'UI theme (light, dark, system)';
COMMENT ON COLUMN user_settings.custom_mcp_servers IS 'Array of custom MCP server configurations';
