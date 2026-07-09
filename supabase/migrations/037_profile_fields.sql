-- 团员档案扩展栏位
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS scout_number TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS home_address TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS emergency_contact TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS emergency_phone TEXT DEFAULT '';
