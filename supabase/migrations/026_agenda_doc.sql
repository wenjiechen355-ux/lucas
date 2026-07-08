-- Add agenda upload for exec meetings
ALTER TABLE events ADD COLUMN IF NOT EXISTS agenda_doc_path TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS agenda_doc_name TEXT;
