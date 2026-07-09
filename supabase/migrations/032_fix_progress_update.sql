-- Allow members to update their own progress items
DROP POLICY IF EXISTS "members_update_own_progress" ON progress_items;

CREATE POLICY "members_update_own_progress" ON progress_items
  FOR UPDATE USING (auth.uid() = member_id);
