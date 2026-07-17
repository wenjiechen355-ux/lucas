-- AI analysis for plan document (計劃書)
-- Extracts time, location, activity flow, responsible persons, budget from plan

ALTER TABLE events ADD COLUMN IF NOT EXISTS plan_raw_text TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS plan_analysis TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS plan_analysis_status TEXT DEFAULT 'none'
  CHECK (plan_analysis_status IN ('none', 'text_extracted', 'analyzed', 'error'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS plan_analyzed_at TIMESTAMPTZ;
