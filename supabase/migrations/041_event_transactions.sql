-- Event financial transactions
CREATE TABLE IF NOT EXISTS event_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL DEFAULT '其他',
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE event_transactions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view transactions
CREATE POLICY "auth_view_transactions" ON event_transactions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Exec/leader can insert
CREATE POLICY "exec_insert_transactions" ON event_transactions
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (role = 'leader' OR position IS NOT NULL)
    )
  );

-- Exec/leader can delete
CREATE POLICY "exec_delete_transactions" ON event_transactions
  FOR DELETE USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (role = 'leader' OR position IS NOT NULL)
    )
  );
