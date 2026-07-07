-- Add attendance_open to events (default false, only chair/vice-chair can toggle)
ALTER TABLE events ADD COLUMN IF NOT EXISTS attendance_open BOOLEAN NOT NULL DEFAULT false;

-- Grant exec members (any position) the ability to toggle attendance_open via update
-- Existing update policy already covers exec members via is_exec() or is_any_exec()
-- We just need to ensure the RLS allows updating this column
