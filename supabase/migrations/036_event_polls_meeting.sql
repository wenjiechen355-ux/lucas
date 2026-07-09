-- 活动投票加 is_exec_meeting
ALTER TABLE event_polls
  ADD COLUMN IF NOT EXISTS is_exec_meeting BOOLEAN NOT NULL DEFAULT false;
