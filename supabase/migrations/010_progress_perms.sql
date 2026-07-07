-- Allow 主席/副主席 to insert/update progress items for any member
DROP POLICY IF EXISTS "members_insert_own_progress" ON progress_items CASCADE;
CREATE POLICY "members_insert_own_progress" ON progress_items FOR INSERT
  WITH CHECK (auth.uid() = member_id OR public.is_leader() OR public.is_exec());

DROP POLICY IF EXISTS "members_view_own_progress" ON progress_items CASCADE;
CREATE POLICY "members_view_own_progress" ON progress_items FOR SELECT
  USING (auth.uid() = member_id OR public.is_leader() OR public.is_exec());

DROP POLICY IF EXISTS "leaders_update_progress" ON progress_items CASCADE;
CREATE POLICY "leaders_update_progress" ON progress_items FOR UPDATE
  USING (public.is_leader() OR public.is_exec());
