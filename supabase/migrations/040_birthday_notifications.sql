-- Add birthday field to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthday DATE;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- announcement, approval_progress, approval_document, activity, review
  title TEXT NOT NULL,
  message TEXT DEFAULT '',
  link TEXT DEFAULT '',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "user_view_own_notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- System/service can insert notifications for any user
CREATE POLICY "service_insert_notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Users can mark their own notifications as read
CREATE POLICY "user_update_own_notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "user_delete_own_notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);
