-- Allow all authenticated users to view profiles (name, position) for reviewer selection
CREATE POLICY "users_view_all_profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');
