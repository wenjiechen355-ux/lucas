-- 活动投票加 event_type
ALTER TABLE event_polls
  ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'unit'
    CHECK (event_type IN ('unit', 'joint', 'exchange'));
