-- Add new design system and audit preference columns to user_settings table

ALTER TABLE user_settings
  -- Design System (shadcn configurables)
  ADD COLUMN IF NOT EXISTS style text DEFAULT 'default' CHECK (style IN ('default', 'new-york')),
  ADD COLUMN IF NOT EXISTS base_color text DEFAULT 'zinc' CHECK (base_color IN ('gray', 'zinc', 'slate', 'stone', 'neutral')),
  ADD COLUMN IF NOT EXISTS theme_color text DEFAULT 'zinc' CHECK (theme_color IN ('red', 'rose', 'orange', 'green', 'blue', 'yellow', 'violet', 'zinc', 'slate', 'stone', 'gray', 'neutral')),
  ADD COLUMN IF NOT EXISTS radius text DEFAULT 'medium' CHECK (radius IN ('none', 'small', 'medium', 'large', 'full')),
  ADD COLUMN IF NOT EXISTS font text DEFAULT 'inter' CHECK (font IN ('inter', 'figtree', 'geist', 'manrope')),
  ADD COLUMN IF NOT EXISTS icon_library text DEFAULT 'lucide' CHECK (icon_library IN ('lucide', 'hugeicons', 'phosphor')),
  ADD COLUMN IF NOT EXISTS menu_color text DEFAULT 'default' CHECK (menu_color IN ('default', 'inverted')),
  ADD COLUMN IF NOT EXISTS menu_accent text DEFAULT 'subtle' CHECK (menu_accent IN ('subtle', 'bold')),
  
  -- Audit Preferences
  ADD COLUMN IF NOT EXISTS agent_mode boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS preferred_model text DEFAULT 'gemini' CHECK (preferred_model IN ('claude', 'gemini', 'gpt4'));

-- Add comment explaining the new columns
COMMENT ON COLUMN user_settings.style IS 'shadcn/ui style variant: default or new-york';
COMMENT ON COLUMN user_settings.base_color IS 'Base neutral color palette';
COMMENT ON COLUMN user_settings.theme_color IS 'Accent/theme color';
COMMENT ON COLUMN user_settings.radius IS 'Border radius for UI elements';
COMMENT ON COLUMN user_settings.font IS 'Primary font family';
COMMENT ON COLUMN user_settings.icon_library IS 'Icon library to use';
COMMENT ON COLUMN user_settings.menu_color IS 'Menu/sidebar color scheme';
COMMENT ON COLUMN user_settings.menu_accent IS 'Menu accent style';
COMMENT ON COLUMN user_settings.agent_mode IS 'Enable AI agent mode for audits';
COMMENT ON COLUMN user_settings.preferred_model IS 'Preferred AI model for analysis';
