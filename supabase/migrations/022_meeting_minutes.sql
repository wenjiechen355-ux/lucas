-- Add meeting/ minutes columns for 執委會開會會議記錄
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_meeting BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS minutes_doc_path TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS minutes_doc_name TEXT;
