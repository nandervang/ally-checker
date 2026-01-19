-- Migration: Add 'manual' input type to audits table
-- Description: Allow 'manual' as a valid input_type for audits, enabling the "Known Issue" feature
-- Created: 2026-01-19

ALTER TABLE audits
DROP CONSTRAINT IF EXISTS audits_input_type_check;

ALTER TABLE audits
ADD CONSTRAINT audits_input_type_check
CHECK (input_type IN ('url', 'html', 'snippet', 'document', 'manual'));
