-- Allow exec/leader to update their own transactions (e.g. toggle received)
ALTER TABLE event_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exec_update_transactions" ON event_transactions
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (role = 'leader' OR position IS NOT NULL)
    )
  );
