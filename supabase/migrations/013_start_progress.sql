-- Set all not_started items to in_progress (can start working on them)
UPDATE public.progress_items SET status = 'in_progress' WHERE status = 'not_started';
