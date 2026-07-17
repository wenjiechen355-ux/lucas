-- 3-step approval for event start: 副主席 → 主席 → 領袖
-- Replaces single start_approval_status with multi-step tracking

-- Step tracking state
ALTER TABLE events ADD COLUMN IF NOT EXISTS approval_state TEXT DEFAULT 'none'
  CHECK (approval_state IN ('none', 'vp_pending', 'vp_approved', 'chair_approved', 'leader_approved', 'rejected'));

-- Step 1: 副主席 approval
ALTER TABLE events ADD COLUMN IF NOT EXISTS vp_approved_by UUID REFERENCES profiles(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS vp_approved_at TIMESTAMPTZ;

-- Step 2: 主席 approval
ALTER TABLE events ADD COLUMN IF NOT EXISTS chair_approved_by UUID REFERENCES profiles(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS chair_approved_at TIMESTAMPTZ;

-- Step 3: 領袖 approval
ALTER TABLE events ADD COLUMN IF NOT EXISTS leader_approved_by UUID REFERENCES profiles(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS leader_approved_at TIMESTAMPTZ;

-- Rejection tracking (any step)
ALTER TABLE events ADD COLUMN IF NOT EXISTS approval_rejected_by UUID REFERENCES profiles(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS approval_rejected_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS approval_rejected_comment TEXT;

-- Migrate existing data: map old start_approval_status to new approval_state
UPDATE events SET
  approval_state = CASE
    WHEN start_approval_status = 'approved' THEN 'vp_approved'
    WHEN start_approval_status = 'rejected' THEN 'rejected'
    WHEN start_approval_status = 'pending' THEN 'vp_pending'
    ELSE 'none'
  END,
  approval_rejected_comment = start_approval_comment
WHERE approval_state IS NULL;
