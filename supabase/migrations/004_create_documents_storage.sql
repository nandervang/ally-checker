-- Create storage bucket for accessibility audit documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audit-documents',
  'audit-documents',
  false, -- Private bucket, requires authentication
  26214400, -- 25MB limit
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy: Users can upload their own documents
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audit-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policy: Users can view their own documents
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'audit-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policy: Users can update their own documents
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'audit-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policy: Users can delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'audit-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add document_path column to audits table
ALTER TABLE audits
ADD COLUMN IF NOT EXISTS document_path TEXT,
ADD COLUMN IF NOT EXISTS document_type TEXT CHECK (document_type IN ('pdf', 'docx'));

-- Add index for faster document lookups
CREATE INDEX IF NOT EXISTS idx_audits_document_path ON audits(document_path);

-- Add comment
COMMENT ON COLUMN audits.document_path IS 'Storage path for uploaded documents (PDF/DOCX)';
COMMENT ON COLUMN audits.document_type IS 'Type of document: pdf or docx';
