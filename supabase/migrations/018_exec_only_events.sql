-- Add is_exec_only flag for exec-only events (執委會例會)
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_exec_only BOOLEAN NOT NULL DEFAULT false;
