-- 活動籌備項目表
CREATE TABLE IF NOT EXISTS event_prep_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,                -- 項目名稱（財政、物資等）
  description TEXT,                   -- 詳細描述（可選）
  responsible_id UUID REFERENCES profiles(id),  -- 負責人（執委會成員）
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 任何有職位嘅執委會成員
CREATE OR REPLACE FUNCTION public.is_any_exec()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND position IS NOT NULL);
$$;

-- RLS
ALTER TABLE event_prep_items ENABLE ROW LEVEL SECURITY;

-- SELECT: 所有執委會成員可睇
CREATE POLICY "exec_view_prep_items" ON event_prep_items FOR SELECT
  USING (public.is_any_exec());

-- INSERT: 所有執委會成員可新增
CREATE POLICY "exec_insert_prep_items" ON event_prep_items FOR INSERT
  WITH CHECK (public.is_any_exec());

-- UPDATE: 負責人可以更新自己嘅項目; 主席/副主席可以更新任何項目
CREATE POLICY "update_prep_items" ON event_prep_items FOR UPDATE
  USING (public.is_any_exec() AND (responsible_id = auth.uid() OR public.is_exec()));

-- DELETE: 主席/副主席可以刪除
CREATE POLICY "chair_delete_prep_items" ON event_prep_items FOR DELETE
  USING (public.is_exec());
