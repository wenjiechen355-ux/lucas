-- Add document approval columns to progress_items
ALTER TABLE public.progress_items
  ADD COLUMN IF NOT EXISTS document_path TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS document_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS document_status TEXT DEFAULT 'none' 
    CHECK (document_status IN ('none', 'pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS reviewer_comment TEXT DEFAULT '';

-- Allow 主席/副主席 to update progress items (approve/reject)
DROP POLICY IF EXISTS "leaders_update_progress" ON progress_items CASCADE;
CREATE POLICY "leaders_update_progress" ON progress_items FOR UPDATE
  USING (public.is_leader() OR public.is_exec());
