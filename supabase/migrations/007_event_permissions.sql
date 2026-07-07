-- Allow 主席/副主席 to create events (in addition to leaders)
-- Drop old policies first
DROP POLICY IF EXISTS "leaders_insert_events" ON events CASCADE;
DROP POLICY IF EXISTS "leaders_update_events" ON events CASCADE;

CREATE POLICY "leaders_insert_events" ON events FOR INSERT
  WITH CHECK (
    public.is_leader() 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND position IN ('主席','副主席'))
  );

CREATE POLICY "leaders_update_events" ON events FOR UPDATE
  USING (
    public.is_leader()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND position IN ('主席','副主席'))
  );
