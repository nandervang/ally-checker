-- Create user_sessions table for session management and user preferences
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User linking
  supabase_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Preferences and locale
  locale VARCHAR(10) NOT NULL DEFAULT 'sv-SE' CHECK (locale IN ('sv-SE', 'en-US')),
  preferences JSONB DEFAULT '{}'::jsonb,
  
  -- Activity tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sessions_supabase_user ON user_sessions(supabase_user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON user_sessions(last_active_at);

-- Enable Row Level Security
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own sessions
DO $$ BEGIN
  CREATE POLICY "Users can view their own sessions"
    ON user_sessions
    FOR SELECT
    USING (
      supabase_user_id = auth.uid() OR
      supabase_user_id IS NULL -- Allow anonymous sessions
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS Policy: Users can create sessions
DO $$ BEGIN
  CREATE POLICY "Users can create their own sessions"
    ON user_sessions
    FOR INSERT
    WITH CHECK (
      supabase_user_id = auth.uid() OR
      supabase_user_id IS NULL -- Allow anonymous sessions
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS Policy: Users can update their own sessions
DO $$ BEGIN
  CREATE POLICY "Users can update their own sessions"
    ON user_sessions
    FOR UPDATE
    USING (
      supabase_user_id = auth.uid() OR
      supabase_user_id IS NULL
    )
    WITH CHECK (
      supabase_user_id = auth.uid() OR
      supabase_user_id IS NULL
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS Policy: Users can delete their own sessions
DO $$ BEGIN
  CREATE POLICY "Users can delete their own sessions"
    ON user_sessions
    FOR DELETE
    USING (
      supabase_user_id = auth.uid() OR
      supabase_user_id IS NULL
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Function to automatically update last_active_at
CREATE OR REPLACE FUNCTION update_last_active_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_active_at on user_sessions
DROP TRIGGER IF EXISTS update_user_sessions_last_active ON user_sessions;
CREATE TRIGGER update_user_sessions_last_active
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_last_active_at();
