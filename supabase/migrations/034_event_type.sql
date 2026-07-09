-- 活动类型分类
-- event_type: 'unit' (团部活动) | 'joint' (联团活动) | 'exchange' (外出交流活动)
-- is_exec_meeting: 是否为执委会例会（仅 unit 类型可选）
-- requires_minutes: 是否需要上传会议记录（仅 unit 类型可选）

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'unit'
    CHECK (event_type IN ('unit', 'joint', 'exchange')),
  ADD COLUMN IF NOT EXISTS is_exec_meeting BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_minutes BOOLEAN NOT NULL DEFAULT false;
