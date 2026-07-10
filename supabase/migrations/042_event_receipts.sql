-- Receipts attached to transactions
CREATE TABLE IF NOT EXISTS event_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES event_transactions(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE event_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_view_receipts" ON event_receipts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "exec_insert_receipts" ON event_receipts
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (role = 'leader' OR position IS NOT NULL)
    )
  );

CREATE POLICY "exec_delete_receipts" ON event_receipts
  FOR DELETE USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (role = 'leader' OR position IS NOT NULL)
    )
  );
