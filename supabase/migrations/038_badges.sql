-- 童军奖章/段章系统
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- 奖章名称
  category TEXT NOT NULL DEFAULT 'other', -- 分类: 段章/技能章/服务章/活动章/其他
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '',                  -- emoji icon
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS member_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'awarded')),
  progress INT DEFAULT 0,               -- 0-100
  awarded_date TIMESTAMPTZ,
  awarded_by UUID REFERENCES profiles(id),
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, badge_id)
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "everyone_view_badges" ON badges FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "leader_insert_badges" ON badges FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'leader')
);
CREATE POLICY "leader_update_badges" ON badges FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'leader')
);

CREATE POLICY "everyone_view_member_badges" ON member_badges FOR SELECT USING (
  auth.uid() = member_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'leader')
);
CREATE POLICY "leader_manage_member_badges" ON member_badges FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'leader')
);

-- 预设勋章（4大段章）
INSERT INTO badges (name, category, description, icon, sort_order) VALUES
  ('會員章', '段章', '成為童軍會員的基本章', '🔰', 1),
  ('初級章', '段章', '完成初級訓練', '⭐', 2),
  ('中級章', '段章', '完成中級訓練', '🌟', 3),
  ('高級章', '段章', '完成高級訓練', '💫', 4)
ON CONFLICT DO NOTHING;
