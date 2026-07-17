-- 049: Add unit_category column to events table
-- Allows sub-categorization of unit events: 宿營活動, 水上活動, 執委會開會

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS unit_category TEXT DEFAULT NULL;

COMMENT ON COLUMN events.unit_category IS 'Sub-category for unit events (宿營活動/水上活動/執委會開會). NULL if not a unit event.';
