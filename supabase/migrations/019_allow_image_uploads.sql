-- Migration: Allow image uploads in audit-documents bucket
-- Description: Update allowed mime types to include images for the "Known Issue" feature
-- Created: 2026-01-19

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/webp'
]
WHERE id = 'audit-documents';
