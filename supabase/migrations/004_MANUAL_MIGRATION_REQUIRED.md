# Document Storage Migration

## Manual Steps Required

The migration `004_create_documents_storage.sql` needs to be applied manually via the Supabase Dashboard.

### Steps:

1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/migrations/004_create_documents_storage.sql`
3. Run the SQL script

### What it does:

- Creates `audit-documents` storage bucket with:
  - 25MB file size limit
  - PDF and DOCX mime types only
  - Private access (requires authentication)
  
- Creates RLS policies for:
  - Users can upload their own documents
  - Users can view their own documents
  - Users can update their own documents
  - Users can delete their own documents

- Adds columns to `audits` table:
  - `document_path` (TEXT) - Storage path for uploaded documents
  - `document_type` (TEXT) - Type of document: 'pdf' or 'docx'
  
- Creates index on `document_path` for faster lookups

### Verify Installation:

After running the migration, verify:

```sql
-- Check bucket exists
SELECT * FROM storage.buckets WHERE id = 'audit-documents';

-- Check policies exist
SELECT * FROM storage.policies WHERE bucket_id = 'audit-documents';

-- Check audits table has new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'audits' 
  AND column_name IN ('document_path', 'document_type');
```

### Alternative: Supabase CLI

If you have the Supabase CLI configured with a connection string:

```bash
supabase db push
```

Choose 'Y' when prompted to apply migrations.
