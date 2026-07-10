ALTER TABLE event_transactions ADD COLUMN IF NOT EXISTS received BOOLEAN DEFAULT false;
