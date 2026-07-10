ALTER TABLE event_transactions ADD COLUMN IF NOT EXISTS responsible_id UUID REFERENCES profiles(id);
ALTER TABLE event_transactions ADD COLUMN IF NOT EXISTS paid_back BOOLEAN DEFAULT false;
