-- Rename start_approved to be more flexible: null=pending, true=approved, false=rejected
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_approval_status TEXT CHECK (start_approval_status IN ('pending','approved','rejected'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_approval_comment TEXT;

-- Migrate existing: start_approved=true → 'approved'
UPDATE events SET start_approval_status = 'approved' WHERE start_approved = true AND start_approval_status IS NULL;
