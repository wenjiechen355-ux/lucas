-- Add plan document columns to events for 活動籌備 計劃書
ALTER TABLE events ADD COLUMN IF NOT EXISTS plan_doc_path TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS plan_doc_name TEXT;
