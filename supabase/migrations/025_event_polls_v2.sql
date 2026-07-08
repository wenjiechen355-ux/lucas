-- Drop old poll tables
DROP TABLE IF EXISTS event_poll_votes CASCADE;
DROP TABLE IF EXISTS event_polls CASCADE;

-- 活動投票（新結構：多欄位 + 多選）
CREATE TABLE event_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

ALTER TABLE event_polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "everyone_view_polls" ON event_polls
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "exec_create_polls" ON event_polls
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND position IS NOT NULL)
  );

CREATE POLICY "exec_close_polls" ON event_polls
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND position IS NOT NULL)
  );

-- 投票記錄
CREATE TABLE event_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES event_polls(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES profiles(id),
  selections JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, member_id)
);

ALTER TABLE event_poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "everyone_view_votes" ON event_poll_votes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "members_vote" ON event_poll_votes
  FOR INSERT WITH CHECK (auth.uid() = member_id);

CREATE POLICY "members_update_vote" ON event_poll_votes
  FOR UPDATE USING (auth.uid() = member_id);
