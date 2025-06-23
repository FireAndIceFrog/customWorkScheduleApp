-- Medical Center Scheduling System Database Schema
-- Designed for Supabase PostgreSQL

-- Enable UUID extension for UUIDv7 generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Doctor table: Medical professionals who book time slots
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Location table: Medical center locations (North Shore centers)
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_name VARCHAR(200) NOT NULL,
    location_key VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Room table: Individual rooms within locations where doctors see patients
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_name VARCHAR(100) NOT NULL,
    location_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_room_location FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE RESTRICT
);

-- Activity table: Time slots booked by doctors (typically 4-hour blocks)
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    room_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_activity_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT,
    CONSTRAINT fk_activity_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT,
    CONSTRAINT chk_activity_time_order CHECK (start_time < end_time)
);

-- Activity Templates table: Recurring schedule patterns for doctors
CREATE TABLE IF NOT EXISTS activity_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL,
    room_id UUID NOT NULL,
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, ..., 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    template_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_template_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT,
    CONSTRAINT fk_template_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT,
    CONSTRAINT chk_day_of_week CHECK (day_of_week >= 0 AND day_of_week <= 6),
    CONSTRAINT chk_template_time_order CHECK (start_time < end_time)
);

-- Add template columns to activities table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'template_id') THEN
        ALTER TABLE activities ADD COLUMN template_id UUID REFERENCES activity_templates(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'generation_month') THEN
        ALTER TABLE activities ADD COLUMN generation_month DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'is_template_generated') THEN
        ALTER TABLE activities ADD COLUMN is_template_generated BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Generation Logs table: Track monthly template generation runs
CREATE TABLE IF NOT EXISTS generation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generation_month DATE NOT NULL, -- YYYY-MM-01 format
    total_templates_processed INTEGER DEFAULT 0,
    total_activities_generated INTEGER DEFAULT 0,
    total_conflicts_skipped INTEGER DEFAULT 0,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    generated_by UUID -- could reference a user/admin table later
);

-- Leave table: Leave applications that block activities and require inbox coverage
CREATE TABLE IF NOT EXISTS leave (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL UNIQUE,
    dr_covering_inbox UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_leave_activity FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    CONSTRAINT fk_leave_covering_doctor FOREIGN KEY (dr_covering_inbox) REFERENCES doctors(id) ON DELETE SET NULL
);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at for all tables (create if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_doctors_updated_at') THEN
        CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_locations_updated_at') THEN
        CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_rooms_updated_at') THEN
        CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_activities_updated_at') THEN
        CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_activity_templates_updated_at') THEN
        CREATE TRIGGER update_activity_templates_updated_at BEFORE UPDATE ON activity_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_leave_updated_at') THEN
        CREATE TRIGGER update_leave_updated_at BEFORE UPDATE ON leave FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
