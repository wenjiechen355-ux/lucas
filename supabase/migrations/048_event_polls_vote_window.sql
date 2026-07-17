-- 048: Add voting time window (start/end) to event_polls
-- Allows organizers to set when voting opens and closes automatically

ALTER TABLE event_polls
  ADD COLUMN IF NOT EXISTS vote_start_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS vote_end_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN event_polls.vote_start_at IS 'Voting opens at this time (NULL = immediately)';
COMMENT ON COLUMN event_polls.vote_end_at IS 'Voting closes at this time (NULL = manual close only)';
