-- Create audits table to store accessibility audit sessions
CREATE TABLE IF NOT EXISTS audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Input information
  input_type TEXT NOT NULL CHECK (input_type IN ('url', 'html', 'snippet')),
  input_value TEXT NOT NULL,
  url TEXT, -- Original URL if input_type is 'url'
  
  -- Analysis metadata
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'analyzing', 'complete', 'failed')),
  ai_model TEXT DEFAULT 'gemini-2.5-flash',
  
  -- Results summary
  total_issues INTEGER DEFAULT 0,
  critical_issues INTEGER DEFAULT 0,
  serious_issues INTEGER DEFAULT 0,
  moderate_issues INTEGER DEFAULT 0,
  minor_issues INTEGER DEFAULT 0,
  
  -- WCAG principle counts
  perceivable_issues INTEGER DEFAULT 0,
  operable_issues INTEGER DEFAULT 0,
  understandable_issues INTEGER DEFAULT 0,
  robust_issues INTEGER DEFAULT 0,
  
  -- Error handling
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create index on user_id for fast user queries
CREATE INDEX IF NOT EXISTS idx_audits_user_id ON audits(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at DESC);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_audits_status ON audits(status);

-- Enable Row Level Security
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own audits
CREATE POLICY "Users can view their own audits"
  ON audits
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own audits
CREATE POLICY "Users can create their own audits"
  ON audits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only update their own audits
CREATE POLICY "Users can update their own audits"
  ON audits
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own audits
CREATE POLICY "Users can delete their own audits"
  ON audits
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on audits
CREATE TRIGGER update_audits_updated_at
  BEFORE UPDATE ON audits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
