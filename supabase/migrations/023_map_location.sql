-- Add latitude/longitude for map location
ALTER TABLE events ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE events ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
