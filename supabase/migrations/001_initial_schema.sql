-- ============================================
-- 澳门童军执委会管理系统 - 数据库 Schema
-- ============================================

-- 1. 用户档案 (Profiles)
-- 由 Supabase Auth 的 user.created trigger 自动创建
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'leader')),
  phone TEXT DEFAULT '',
  scout_unit TEXT DEFAULT '',      -- 旅團名称
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 注册时自动创建 profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. 活动
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_date DATE NOT NULL,
  location TEXT DEFAULT '',
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 出席记录
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'excused')),
  checkin_time TIMESTAMPTZ,
  remark TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, member_id)   -- 每人每活动只能有一条记录
);

-- 4. 进度项
CREATE TABLE progress_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completed_date TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_progress_items_updated_at
  BEFORE UPDATE ON progress_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. 文档
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  file_path TEXT NOT NULL,            -- Supabase Storage 路径
  file_name TEXT NOT NULL,            -- 原始文件名
  file_size BIGINT DEFAULT 0,
  file_type TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_id UUID REFERENCES profiles(id),
  review_comment TEXT DEFAULT '',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Profiles: 用户可以看自己的, 领导可以看所有
CREATE POLICY "users_view_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'leader'));

CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Events: 所有认证用户可看, 领导可创建/编辑
CREATE POLICY "all_users_view_events" ON events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "leaders_insert_events" ON events
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'leader')
  );

CREATE POLICY "leaders_update_events" ON events
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'leader')
  );

-- Attendance: 用户看自己的, 领导看所有
CREATE POLICY "members_view_own_attendance" ON attendance
  FOR SELECT USING (auth.uid() = member_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'leader'));

CREATE POLICY "members_insert_own_attendance" ON attendance
  FOR INSERT WITH CHECK (auth.uid() = member_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'leader'));

CREATE POLICY "leaders_update_attendance" ON attendance
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'leader')
  );

-- Progress: 用户看自己的, 领导看所有
CREATE POLICY "members_view_own_progress" ON progress_items
  FOR SELECT USING (auth.uid() = member_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'leader'));

CREATE POLICY "members_insert_own_progress" ON progress_items
  FOR INSERT WITH CHECK (auth.uid() = member_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'leader'));

CREATE POLICY "leaders_update_progress" ON progress_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'leader')
  );

-- Documents: 用户看自己的, 领导看所有
CREATE POLICY "members_view_own_documents" ON documents
  FOR SELECT USING (auth.uid() = member_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'leader'));

CREATE POLICY "members_insert_own_documents" ON documents
  FOR INSERT WITH CHECK (auth.uid() = member_id);

CREATE POLICY "leaders_update_documents" ON documents
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'leader')
  );

-- 7. Storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "users_upload_own_documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND auth.role() = 'authenticated'
  );

CREATE POLICY "users_view_documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND auth.role() = 'authenticated'
  );
