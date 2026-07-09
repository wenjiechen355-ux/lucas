-- 活动相册
CREATE TABLE IF NOT EXISTS event_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  caption TEXT DEFAULT '',
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "everyone_view_photos" ON event_photos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_upload_photos" ON event_photos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "owner_delete_photos" ON event_photos
  FOR DELETE USING (auth.uid() = uploaded_by);

-- Storage bucket for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "authenticated_upload_photos_storage" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');

CREATE POLICY "public_read_photos_storage" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');
