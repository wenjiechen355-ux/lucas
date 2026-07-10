-- Migration 047: Add is_online flag for events
-- When true, the event is held online and no physical address is needed

ALTER TABLE events ADD COLUMN IF NOT EXISTS is_online BOOLEAN NOT NULL DEFAULT false;
