-- Additional Constraints for Medical Center Scheduling System
-- Data integrity and business rules enforcement

-- Add constraints only if they don't already exist
DO $$
BEGIN
    -- Ensure room names are unique within each location
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_room_name_per_location') THEN
        ALTER TABLE rooms ADD CONSTRAINT uq_room_name_per_location UNIQUE (location_id, room_name);
    END IF;

    -- Ensure doctor names combination is unique (prevent duplicate doctor entries)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_doctor_full_name') THEN
        ALTER TABLE doctors ADD CONSTRAINT uq_doctor_full_name UNIQUE (first_name, last_name);
    END IF;

    -- Ensure activity times are reasonable (not in the past, not longer than 24 hours)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_activity_not_past') THEN
        ALTER TABLE activities ADD CONSTRAINT chk_activity_not_past CHECK (start_time >= CURRENT_DATE);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_activity_max_duration') THEN
        ALTER TABLE activities ADD CONSTRAINT chk_activity_max_duration CHECK (end_time - start_time <= INTERVAL '24 hours');
    END IF;

    -- Ensure location keys are valid format (alphanumeric with underscores/dashes)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_location_key_format') THEN
        ALTER TABLE locations ADD CONSTRAINT chk_location_key_format CHECK (location_key ~ '^[a-zA-Z0-9_-]+$');
    END IF;

    -- Ensure names are not empty strings
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_doctor_first_name_not_empty') THEN
        ALTER TABLE doctors ADD CONSTRAINT chk_doctor_first_name_not_empty CHECK (LENGTH(TRIM(first_name)) > 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_doctor_last_name_not_empty') THEN
        ALTER TABLE doctors ADD CONSTRAINT chk_doctor_last_name_not_empty CHECK (LENGTH(TRIM(last_name)) > 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_location_name_not_empty') THEN
        ALTER TABLE locations ADD CONSTRAINT chk_location_name_not_empty CHECK (LENGTH(TRIM(location_name)) > 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_room_name_not_empty') THEN
        ALTER TABLE rooms ADD CONSTRAINT chk_room_name_not_empty CHECK (LENGTH(TRIM(room_name)) > 0);
    END IF;
END $$;

-- Row Level Security (RLS) policies for Supabase
-- Enable RLS on all tables
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (basic read/write access)
-- Note: These are basic policies - adjust based on your authentication requirements

-- Drop existing policies and recreate them to ensure consistency
DO $$
BEGIN
    -- Doctors table policies
    DROP POLICY IF EXISTS "Allow authenticated users to read doctors" ON doctors;
    DROP POLICY IF EXISTS "Allow authenticated users to insert doctors" ON doctors;
    DROP POLICY IF EXISTS "Allow authenticated users to update doctors" ON doctors;
    
    CREATE POLICY "Allow authenticated users to read doctors" ON doctors
        FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Allow authenticated users to insert doctors" ON doctors
        FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "Allow authenticated users to update doctors" ON doctors
        FOR UPDATE TO authenticated USING (true);

    -- Locations table policies
    DROP POLICY IF EXISTS "Allow authenticated users to read locations" ON locations;
    DROP POLICY IF EXISTS "Allow authenticated users to manage locations" ON locations;
    
    CREATE POLICY "Allow authenticated users to read locations" ON locations
        FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Allow authenticated users to manage locations" ON locations
        FOR ALL TO authenticated USING (true);

    -- Rooms table policies
    DROP POLICY IF EXISTS "Allow authenticated users to read rooms" ON rooms;
    DROP POLICY IF EXISTS "Allow authenticated users to manage rooms" ON rooms;
    
    CREATE POLICY "Allow authenticated users to read rooms" ON rooms
        FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Allow authenticated users to manage rooms" ON rooms
        FOR ALL TO authenticated USING (true);

    -- Activities table policies
    DROP POLICY IF EXISTS "Allow authenticated users to read activities" ON activities;
    DROP POLICY IF EXISTS "Allow authenticated users to manage activities" ON activities;
    
    CREATE POLICY "Allow authenticated users to read activities" ON activities
        FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Allow authenticated users to manage activities" ON activities
        FOR ALL TO authenticated USING (true);

    -- Activity Templates table policies
    DROP POLICY IF EXISTS "Allow authenticated users to read activity_templates" ON activity_templates;
    DROP POLICY IF EXISTS "Allow authenticated users to manage activity_templates" ON activity_templates;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_templates') THEN
        CREATE POLICY "Allow authenticated users to read activity_templates" ON activity_templates
            FOR SELECT TO authenticated USING (true);
        CREATE POLICY "Allow authenticated users to manage activity_templates" ON activity_templates
            FOR ALL TO authenticated USING (true);
    END IF;

    -- Generation Logs table policies
    DROP POLICY IF EXISTS "Allow authenticated users to read generation_logs" ON generation_logs;
    DROP POLICY IF EXISTS "Allow authenticated users to manage generation_logs" ON generation_logs;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'generation_logs') THEN
        CREATE POLICY "Allow authenticated users to read generation_logs" ON generation_logs
            FOR SELECT TO authenticated USING (true);
        CREATE POLICY "Allow authenticated users to manage generation_logs" ON generation_logs
            FOR ALL TO authenticated USING (true);
    END IF;

    -- Leave table policies
    DROP POLICY IF EXISTS "Allow authenticated users to read leave" ON leave;
    DROP POLICY IF EXISTS "Allow authenticated users to manage leave" ON leave;
    
    CREATE POLICY "Allow authenticated users to read leave" ON leave
        FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Allow authenticated users to manage leave" ON leave
        FOR ALL TO authenticated USING (true);
        
EXCEPTION
    WHEN OTHERS THEN
        -- Continue if policies don't exist or other errors occur
        NULL;
END $$;
