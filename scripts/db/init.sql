-- EV Trips Community — Docker init script
-- This file is mounted by docker-compose and runs once when the container
-- is first created (only if the volume is empty).
--
-- The full schema is in apps/api/src/database/migrations/001_initial_schema.sql
-- Run that file manually after the container starts:
--
--   docker exec -i ev_trips_postgres psql \
--     -U ev_trips_user -d ev_trips_db \
--     < apps/api/src/database/migrations/001_initial_schema.sql
--
-- This file just ensures the database and extensions exist.

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
