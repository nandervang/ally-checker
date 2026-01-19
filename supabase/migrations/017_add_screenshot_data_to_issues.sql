-- Add screenshot_data column to issues table
ALTER TABLE issues 
ADD COLUMN screenshot_data JSONB DEFAULT NULL;

COMMENT ON COLUMN issues.screenshot_data IS 'Detailed screenshot data including base64, dimensions, and selector specific to this issue';
