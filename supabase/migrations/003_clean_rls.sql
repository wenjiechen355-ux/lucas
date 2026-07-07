-- Clean up ALL existing policies and recreate properly
-- This replaces both 001 and 002 policy definitions

-- Drop ALL old policies (from migration 001)
DROP POLICY IF EXISTS "users_view_own_profile" ON profiles CASCADE;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles CASCADE;
DROP POLICY IF EXISTS "all_users_view_events" ON events CASCADE;
DROP POLICY IF EXISTS "leaders_insert_events" ON events CASCADE;
DROP POLICY IF EXISTS "leaders_update_events" ON events CASCADE;
DROP POLICY IF EXISTS "members_view_own_attendance" ON attendance CASCADE;
DROP POLICY IF EXISTS "members_insert_own_attendance" ON attendance CASCADE;
DROP POLICY IF EXISTS "leaders_update_attendance" ON attendance CASCADE;
DROP POLICY IF EXISTS "members_view_own_progress" ON progress_items CASCADE;
DROP POLICY IF EXISTS "members_insert_own_progress" ON progress_items CASCADE;
DROP POLICY IF EXISTS "leaders_update_progress" ON progress_items CASCADE;
DROP POLICY IF EXISTS "members_view_own_documents" ON documents CASCADE;
DROP POLICY IF EXISTS "members_insert_own_documents" ON documents CASCADE;
DROP POLICY IF EXISTS "leaders_update_documents" ON documents CASCADE;

-- Drop any policies from migration 002 (if they somehow got created)
DROP POLICY IF EXISTS "profiles_select" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_update" ON profiles CASCADE;
DROP POLICY IF EXISTS "events_select" ON events CASCADE;
DROP POLICY IF EXISTS "events_insert" ON events CASCADE;
DROP POLICY IF EXISTS "events_update" ON events CASCADE;
DROP POLICY IF EXISTS "attendance_select" ON attendance CASCADE;
DROP POLICY IF EXISTS "attendance_insert" ON attendance CASCADE;
DROP POLICY IF EXISTS "attendance_update" ON attendance CASCADE;
DROP POLICY IF EXISTS "progress_select" ON progress_items CASCADE;
DROP POLICY IF EXISTS "progress_insert" ON progress_items CASCADE;
DROP POLICY IF EXISTS "progress_update" ON progress_items CASCADE;
DROP POLICY IF EXISTS "documents_select" ON documents CASCADE;
DROP POLICY IF EXISTS "documents_insert" ON documents CASCADE;
DROP POLICY IF EXISTS "documents_update" ON documents CASCADE;

-- Create is_leader() function (SECURITY DEFINER = runs as owner, bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_leader()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'leader');
$$;

-- Recreate ALL policies
CREATE POLICY "users_view_own_profile" ON profiles FOR SELECT
  USING (auth.uid() = id OR public.is_leader());

CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "all_users_view_events" ON events FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "leaders_insert_events" ON events FOR INSERT
  WITH CHECK (public.is_leader());

CREATE POLICY "leaders_update_events" ON events FOR UPDATE
  USING (public.is_leader());

CREATE POLICY "members_view_own_attendance" ON attendance FOR SELECT
  USING (auth.uid() = member_id OR public.is_leader());

CREATE POLICY "members_insert_own_attendance" ON attendance FOR INSERT
  WITH CHECK (auth.uid() = member_id OR public.is_leader());

CREATE POLICY "leaders_update_attendance" ON attendance FOR UPDATE
  USING (public.is_leader());

CREATE POLICY "members_view_own_progress" ON progress_items FOR SELECT
  USING (auth.uid() = member_id OR public.is_leader());

CREATE POLICY "members_insert_own_progress" ON progress_items FOR INSERT
  WITH CHECK (auth.uid() = member_id OR public.is_leader());

CREATE POLICY "leaders_update_progress" ON progress_items FOR UPDATE
  USING (public.is_leader());

CREATE POLICY "members_view_own_documents" ON documents FOR SELECT
  USING (auth.uid() = member_id OR public.is_leader());

CREATE POLICY "members_insert_own_documents" ON documents FOR INSERT
  WITH CHECK (auth.uid() = member_id);

CREATE POLICY "leaders_update_documents" ON documents FOR UPDATE
  USING (public.is_leader());

-- Insert user profile (was created before trigger)
INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('d60b3a76-2568-4c97-ae79-4ae851a03234', 'wenjiechen355@gmail.com', '陳文傑', 'member')
ON CONFLICT (id) DO NOTHING;
