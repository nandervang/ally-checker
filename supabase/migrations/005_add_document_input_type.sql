-- Update input_type check constraint to include 'document'
ALTER TABLE audits
DROP CONSTRAINT IF EXISTS audits_input_type_check;

ALTER TABLE audits
ADD CONSTRAINT audits_input_type_check
CHECK (input_type IN ('url', 'html', 'snippet', 'document'));
