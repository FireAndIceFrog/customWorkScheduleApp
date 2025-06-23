-- Database Indexes for Medical Center Scheduling System
-- Optimized for Supabase PostgreSQL

-- Indexes for foreign key relationships to improve join performance
CREATE INDEX IF NOT EXISTS idx_rooms_location_id ON rooms(location_id);
CREATE INDEX IF NOT EXISTS idx_activities_room_id ON activities(room_id);
CREATE INDEX IF NOT EXISTS idx_activities_doctor_id ON activities(doctor_id);
CREATE INDEX IF NOT EXISTS idx_leave_activity_id ON leave(activity_id);
CREATE INDEX IF NOT EXISTS idx_leave_covering_doctor ON leave(dr_covering_inbox);

-- Composite indexes for time-based queries (admin dashboard needs)
-- For checking room availability and conflicts
CREATE INDEX IF NOT EXISTS idx_activities_room_time ON activities(room_id, start_time, end_time);

-- For doctor schedule queries by date
CREATE INDEX IF NOT EXISTS idx_activities_doctor_date ON activities(doctor_id, start_time);

-- For daily/weekly schedule views
CREATE INDEX IF NOT EXISTS idx_activities_start_time ON activities(start_time);
CREATE INDEX IF NOT EXISTS idx_activities_end_time ON activities(end_time);

-- For location-based room queries
CREATE INDEX IF NOT EXISTS idx_rooms_location_name ON rooms(location_id, room_name);

-- For doctor name searches
CREATE INDEX IF NOT EXISTS idx_doctors_name ON doctors(last_name, first_name);

-- For location key lookups
CREATE INDEX IF NOT EXISTS idx_locations_key ON locations(location_key);

-- Indexes for Activity Templates (recurring activities)
CREATE INDEX IF NOT EXISTS idx_activity_templates_doctor_id ON activity_templates(doctor_id);
CREATE INDEX IF NOT EXISTS idx_activity_templates_room_id ON activity_templates(room_id);
CREATE INDEX IF NOT EXISTS idx_activity_templates_day_of_week ON activity_templates(day_of_week);
CREATE INDEX IF NOT EXISTS idx_activity_templates_active ON activity_templates(is_active, doctor_id);

-- Composite index for template conflict checking during generation
CREATE INDEX IF NOT EXISTS idx_activity_templates_doctor_day_time ON activity_templates(doctor_id, day_of_week, start_time, end_time);

-- Indexes for template-generated activities (only create if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'template_id') THEN
        CREATE INDEX IF NOT EXISTS idx_activities_template_id ON activities(template_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'generation_month') THEN
        CREATE INDEX IF NOT EXISTS idx_activities_generation_month ON activities(generation_month);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'is_template_generated') THEN
        CREATE INDEX IF NOT EXISTS idx_activities_template_generated ON activities(is_template_generated);
        -- Composite index for monthly generation queries
        CREATE INDEX IF NOT EXISTS idx_activities_template_month ON activities(template_id, generation_month) WHERE is_template_generated = true;
    END IF;
END $$;

-- Index for generation logs
CREATE INDEX IF NOT EXISTS idx_generation_logs_month ON generation_logs(generation_month);

-- Partial index for active templates only
CREATE INDEX IF NOT EXISTS idx_active_templates_doctor_room ON activity_templates(doctor_id, room_id, day_of_week) WHERE is_active = true;

-- Partial index for leave activities specifically
CREATE INDEX IF NOT EXISTS idx_leave_activities_time ON activities(doctor_id, start_time) 