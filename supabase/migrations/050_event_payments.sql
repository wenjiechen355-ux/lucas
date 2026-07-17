-- 050: Event payment tracking system
-- Supports pre-payment (before event) and post-payment (after event)

-- Add payment_type to events
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT NULL
    CHECK (payment_type IN ('pre', 'post'));

COMMENT ON COLUMN events.payment_type IS 'Payment mode: pre = 事前付款, post = 事後付款, NULL = no payment';

-- Payment assignments & receipt tracking per member
CREATE TABLE IF NOT EXISTS event_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid')),
  receipt_path TEXT,
  receipt_name TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, member_id)
);

COMMENT ON TABLE event_payments IS 'Tracks who needs to pay and their payment status for each event';
COMMENT ON COLUMN event_payments.status IS 'pending = 未付款, paid = 已付款';
COMMENT ON COLUMN event_payments.receipt_path IS 'Storage path for uploaded receipt file';
COMMENT ON COLUMN event_payments.receipt_name IS 'Original filename of the receipt';

-- Enable RLS
ALTER TABLE event_payments ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated users can view payments
CREATE POLICY "view_payments" ON event_payments
  FOR SELECT USING (auth.role() = 'authenticated');

-- RLS: leader/exec can insert/update payment assignments
CREATE POLICY "manage_payments" ON event_payments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'leader' OR position IS NOT NULL))
  );

CREATE POLICY "update_payments" ON event_payments
  FOR UPDATE USING (
    -- Leader/exec can update anyone; members can only update their own
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'leader' OR position IS NOT NULL))
    OR member_id = auth.uid()
  );

-- RLS: leader/exec can delete payment assignments
CREATE POLICY "delete_payments" ON event_payments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'leader' OR position IS NOT NULL))
  );
