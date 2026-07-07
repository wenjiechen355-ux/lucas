-- Event lifecycle: preparation → active → completed
ALTER TABLE events ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'preparation' CHECK (status IN ('preparation','active','completed'));

-- Documents for post-event submission
ALTER TABLE events ADD COLUMN IF NOT EXISTS finance_doc_path TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS finance_doc_name TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS photo_doc_path TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS photo_doc_name TEXT;
