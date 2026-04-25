ALTER TABLE trip_stops
  ADD COLUMN IF NOT EXISTS distance_from_start_km NUMERIC(7, 2) NULL;
