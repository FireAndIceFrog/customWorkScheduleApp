-- Set the target version for this upgrade script
-- This script upgrades from version 1 to version 2
.parameter set upgrade_version 2

-- Activity Templates schema for recurring activities system
-- Enables doctors to create templates for regular weekly schedules
-- Supports automated monthly generation of concrete activities

BEGIN;

-- Only apply if current version is exactly (upgrade_version - 1)
SELECT CASE WHEN COALESCE(MAX(version), 0) != $upgrade_version - 1 THEN RAISE(IGNORE) END FROM database_version;

-- Activity Templates table - stores recurring patterns for doctors' regular schedules
-- Templates remain active until manually deactivated, unaffected by leave applications
CREATE TABLE IF NOT EXISTS activity_templates (
    id TEXT PRIMARY KEY,
    doctor_id TEXT NOT NULL,
    room_id TEXT NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    start_time TEXT NOT NULL, -- HH:MM format (e.g., '09:00')
    end_time TEXT NOT NULL,   -- HH:MM format (e.g., '13:00')
    template_name TEXT, -- Optional descriptive name (e.g., 'Monday Morning Clinic')
    is_active INTEGER NOT NULL DEFAULT 1, -- Boolean flag (1=active, 0=inactive)
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    -- Prevent duplicate templates for same doctor/room/time combination
    UNIQUE(doctor_id, room_id, day_of_week, start_time, end_time)
);

-- Generation Logs table - tracks automated monthly generation process
-- Provides audit trail for template processing and conflict resolution
CREATE TABLE IF NOT EXISTS generation_logs (
    id TEXT PRIMARY KEY,
    generation_month TEXT NOT NULL, -- YYYY-MM format (e.g., '2025-01')
    total_templates_processed INTEGER NOT NULL DEFAULT 0,
    total_activities_generated INTEGER NOT NULL DEFAULT 0,
    total_conflicts_skipped INTEGER NOT NULL DEFAULT 0,
    generation_status TEXT DEFAULT 'COMPLETED', -- COMPLETED, FAILED, PARTIAL
    error_message TEXT, -- Details if generation failed
    generated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    generated_by TEXT -- System identifier or user who triggered generation
);

-- Extend activities table with template-related columns
-- These link generated activities back to their source templates
ALTER TABLE activities ADD COLUMN template_id TEXT REFERENCES activity_templates(id) ON DELETE SET NULL;
ALTER TABLE activities ADD COLUMN generation_month TEXT; -- YYYY-MM format
ALTER TABLE activities ADD COLUMN is_template_generated INTEGER DEFAULT 0; -- Boolean flag

-- Indexes for template-based queries and generation performance

-- Template lookups by doctor and active status
CREATE INDEX IF NOT EXISTS idx_templates_doctor_active ON activity_templates(doctor_id, is_active);

-- Template day-of-week queries for generation process
CREATE INDEX IF NOT EXISTS idx_templates_day_active ON activity_templates(day_of_week, is_active);

-- Room-based template conflicts
CREATE INDEX IF NOT EXISTS idx_templates_room_day_time ON activity_templates(room_id, day_of_week, start_time, end_time);

-- Generated activity tracking
CREATE INDEX IF NOT EXISTS idx_activities_template_month ON activities(template_id, generation_month);

-- Monthly generation status tracking
CREATE INDEX IF NOT EXISTS idx_generation_month ON generation_logs(generation_month);

-- Activity generation queries (find template-generated activities)
CREATE INDEX IF NOT EXISTS idx_activities_generated ON activities(is_template_generated, generation_month);

-- Template-generated activity lookups
CREATE INDEX IF NOT EXISTS idx_activities_template_generated ON activities(template_id, is_template_generated);

-- Update to new version
INSERT OR IGNORE INTO database_version (version, description) VALUES ($upgrade_version, 'Activity templates and recurring activities system');
UPDATE database_version SET version = $upgrade_version, applied_at = strftime('%s', 'now') WHERE version = $upgrade_version - 1;

COMMIT;
