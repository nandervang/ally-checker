-- Add session_id and suspected_issue columns to existing audits table
ALTER TABLE audits ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS suspected_issue TEXT;

-- Create index on session_id
CREATE INDEX IF NOT EXISTS idx_audits_session_id ON audits(session_id);
