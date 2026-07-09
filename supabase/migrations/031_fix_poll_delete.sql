-- Add delete policy for event_polls (was missing before)
CREATE POLICY "exec_delete_polls" ON event_polls
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND position IS NOT NULL)
  );
