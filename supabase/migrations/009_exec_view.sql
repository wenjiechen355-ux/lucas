-- Allow 主席/副主席 to view all profiles and attendance

-- 1. Create exec check function (like is_leader but for position)
CREATE OR REPLACE FUNCTION public.is_exec()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND position IN ('主席','副主席'));
$$;

-- 2. Update profiles_select to allow exec members
DROP POLICY IF EXISTS "users_view_own_profile" ON profiles CASCADE;
CREATE POLICY "users_view_own_profile" ON profiles FOR SELECT
  USING (auth.uid() = id OR public.is_leader() OR public.is_exec());

-- 3. Update attendance_select to allow exec members
DROP POLICY IF EXISTS "members_view_own_attendance" ON attendance CASCADE;
CREATE POLICY "members_view_own_attendance" ON attendance FOR SELECT
  USING (auth.uid() = member_id OR public.is_leader() OR public.is_exec());
