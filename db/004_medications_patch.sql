-- Add medications array to residents
ALTER TABLE residents ADD COLUMN medications JSONB DEFAULT '[]'::jsonb;
