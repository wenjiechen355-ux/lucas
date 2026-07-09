-- Add start approval for events
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_approved BOOLEAN NOT NULL DEFAULT false;
