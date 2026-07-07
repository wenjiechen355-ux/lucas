-- Allow 主席/副主席 to delete events
DROP POLICY IF EXISTS "leaders_update_events" ON events CASCADE;
CREATE POLICY "leaders_update_events" ON events FOR UPDATE
  USING (public.is_leader() OR public.is_exec());

CREATE POLICY "leaders_delete_events" ON events FOR DELETE
  USING (public.is_leader() OR public.is_exec());
