-- Fix RLS infinite recursion + create missing profile
-- Run AFTER 001_initial_schema.sql

-- Drop problem policies that use subquery on profiles (causes recursion)
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

-- Create security definer function to break recursion
CREATE OR REPLACE FUNCTION public.is_leader()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'leader');
$$;

-- Recreate all policies using the function
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (auth.uid() = id OR public.is_leader());

CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "events_select" ON events FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "events_insert" ON events FOR INSERT
  WITH CHECK (public.is_leader());

CREATE POLICY "events_update" ON events FOR UPDATE
  USING (public.is_leader());

CREATE POLICY "attendance_select" ON attendance FOR SELECT
  USING (auth.uid() = member_id OR public.is_leader());

CREATE POLICY "attendance_insert" ON attendance FOR INSERT
  WITH CHECK (auth.uid() = member_id OR public.is_leader());

CREATE POLICY "attendance_update" ON attendance FOR UPDATE
  USING (public.is_leader());

CREATE POLICY "progress_select" ON progress_items FOR SELECT
  USING (auth.uid() = member_id OR public.is_leader());

CREATE POLICY "progress_insert" ON progress_items FOR INSERT
  WITH CHECK (auth.uid() = member_id OR public.is_leader());

CREATE POLICY "progress_update" ON progress_items FOR UPDATE
  USING (public.is_leader());

CREATE POLICY "documents_select" ON documents FOR SELECT
  USING (auth.uid() = member_id OR public.is_leader());

CREATE POLICY "documents_insert" ON documents FOR INSERT
  WITH CHECK (auth.uid() = member_id);

CREATE POLICY "documents_update" ON documents FOR UPDATE
  USING (public.is_leader());

-- Insert existing user profile (registed before trigger existed)
INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('d60b3a76-2568-4c97-ae79-4ae851a03234', 'wenjiechen355@gmail.com', '陳文傑', 'member')
ON CONFLICT (id) DO NOTHING;
