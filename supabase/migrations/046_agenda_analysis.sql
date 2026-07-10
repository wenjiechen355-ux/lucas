-- Migration 046: Agenda AI Analysis
-- Add columns for agenda text extraction and AI analysis results

ALTER TABLE events ADD COLUMN IF NOT EXISTS agenda_raw_text TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS agenda_analysis TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS agenda_analysis_status TEXT DEFAULT NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS agenda_analyzed_at TIMESTAMPTZ;
