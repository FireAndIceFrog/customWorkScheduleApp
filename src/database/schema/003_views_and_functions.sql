-- Set the target version for this upgrade script
-- This script upgrades from version 2 to version 3
.parameter set upgrade_version 3

-- Database views and helper queries for admin interface
-- Provides convenient access patterns for the required admin queries

BEGIN;

-- Only apply if current version is exactly (upgrade_version - 1)
SELECT CASE WHEN COALESCE(MAX(version), 0) != $upgrade_version - 1 THEN RAISE(IGNORE) END FROM database_version;

-- View: Doctor Daily Schedule
-- Shows bookings for a doctor on a specific day with room information
-- Supports the admin query: "bookings a doctor has for a day"
CREATE VIEW IF NOT EXISTS v_doctor_daily_schedule AS
SELECT 
    d.id as doctor_id,
    d.first_name || ' ' || d.last_name as doctor_name,
    DATE(a.start_time, 'unixepoch', 'localtime') as activity_date,
    TIME(a.start_time, 'unixepoch', 'localtime') as start_time,
    TIME(a.end_time, 'unixepoch', 'localtime') as end_time,
    r.room_name,
    r.room_number,
    l.location_name,
    CASE 
        WHEN a.activity_type = 'LEAVE' THEN 'LEAVE'
        WHEN EXISTS (SELECT 1 FROM leaves WHERE activity_id = a.id) THEN 'LEAVE'
        ELSE 'SCHEDULED'
    END as status,
    a.notes
FROM activities a
JOIN doctors d ON a.doctor_id = d.id
JOIN rooms r ON a.room_id = r.id
JOIN locations l ON r.location_id = l.id
ORDER BY d.last_name, d.first_name, a.start_time;

-- View: Doctor Weekly Schedule
-- Shows which rooms a doctor is working in for each day of the week
-- Supports the admin query: "if a doctor is working in the week"
CREATE VIEW IF NOT EXISTS v_doctor_weekly_schedule AS
SELECT 
    d.id as doctor_id,
    d.first_name || ' ' || d.last_name as doctor_name,
    strftime('%w', DATE(a.start_time, 'unixepoch', 'localtime')) as day_of_week,
    CASE strftime('%w', DATE(a.start_time, 'unixepoch', 'localtime'))
        WHEN '0' THEN 'Sunday'
        WHEN '1' THEN 'Monday' 
        WHEN '2' THEN 'Tuesday'
        WHEN '3' THEN 'Wednesday'
        WHEN '4' THEN 'Thursday'
        WHEN '5' THEN 'Friday'
        WHEN '6' THEN 'Saturday'
    END as day_name,
    DATE(a.start_time, 'unixepoch', 'localtime') as activity_date,
    r.room_name,
    r.room_number,
    CASE 
        WHEN a.activity_type = 'LEAVE' THEN 'LEAVE'
        WHEN EXISTS (SELECT 1 FROM leaves WHERE activity_id = a.id) THEN 'LEAVE'
        ELSE r.room_name || ' ' || COALESCE(r.room_number, '')
    END as display_value
FROM activities a
JOIN doctors d ON a.doctor_id = d.id
JOIN rooms r ON a.room_id = r.id
ORDER BY d.last_name, d.first_name, a.start_time;

-- View: Room Activities with Coverage Status
-- Shows activities for each room with coverage requirements
-- Supports the admin query: "activities for the room" with REQUIRING COVER status
CREATE VIEW IF NOT EXISTS v_room_activities AS
SELECT 
    r.id as room_id,
    r.room_name,
    r.room_number,
    l.location_name,
    DATE(a.start_time, 'unixepoch', 'localtime') as activity_date,
    TIME(a.start_time, 'unixepoch', 'localtime') as start_time,
    TIME(a.end_time, 'unixepoch', 'localtime') as end_time,
    d.first_name || ' ' || d.last_name as doctor_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM leaves WHERE activity_id = a.id) THEN 'REQUIRING COVER'
        WHEN a.activity_type = 'LEAVE' THEN 'REQUIRING COVER'
        ELSE 'SCHEDULED'
    END as coverage_status,
    a.notes
FROM activities a
JOIN doctors d ON a.doctor_id = d.id
JOIN rooms r ON a.room_id = r.id
JOIN locations l ON r.location_id = l.id
ORDER BY r.room_name, a.start_time;

-- View: Doctor Inbox Coverage Status  
-- Shows doctors who need inbox coverage due to leave
-- Supports the admin query: "inbox coverage requirements"
CREATE VIEW IF NOT EXISTS v_inbox_coverage AS
SELECT 
    d.id as doctor_id,
    d.first_name || ' ' || d.last_name as doctor_name,
    d.email,
    DATE(a.start_time, 'unixepoch', 'localtime') as leave_date,
    lv.leave_type,
    lv.reason,
    CASE 
        WHEN lv.dr_covering_inbox IS NOT NULL THEN 
            (SELECT dc.first_name || ' ' || dc.last_name FROM doctors dc WHERE dc.id = lv.dr_covering_inbox)
        ELSE 'REQUIRING COVER'
    END as inbox_coverage_status,
    lv.approval_status
FROM activities a
JOIN doctors d ON a.doctor_id = d.id
JOIN leaves lv ON lv.activity_id = a.id
WHERE lv.approval_status IN ('PENDING', 'APPROVED')
ORDER BY a.start_time, d.last_name, d.first_name;

-- View: Template Generation Summary
-- Shows monthly generation statistics for monitoring template system
CREATE VIEW IF NOT EXISTS v_template_generation_summary AS
SELECT 
    gl.generation_month,
    gl.total_templates_processed,
    gl.total_activities_generated,
    gl.total_conflicts_skipped,
    gl.generation_status,
    DATE(gl.generated_at, 'unixepoch', 'localtime') as generated_date,
    ROUND(
        CAST(gl.total_activities_generated AS FLOAT) / 
        NULLIF(gl.total_templates_processed, 0) * 100, 2
    ) as success_rate_percent
FROM generation_logs gl
ORDER BY gl.generation_month DESC;

-- View: Active Templates Summary
-- Shows all active templates with doctor and room information
CREATE VIEW IF NOT EXISTS v_active_templates AS
SELECT 
    at.id as template_id,
    d.first_name || ' ' || d.last_name as doctor_name,
    r.room_name,
    r.room_number,
    l.location_name,
    CASE at.day_of_week
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday' 
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END as day_name,
    at.start_time,
    at.end_time,
    at.template_name,
    DATE(at.created_at, 'unixepoch', 'localtime') as created_date
FROM activity_templates at
JOIN doctors d ON at.doctor_id = d.id
JOIN rooms r ON at.room_id = r.id
JOIN locations l ON r.location_id = l.id
WHERE at.is_active = 1
ORDER BY d.last_name, d.first_name, at.day_of_week, at.start_time;

-- Update to new version
INSERT OR IGNORE INTO database_version (version, description) VALUES ($upgrade_version, 'Database views and admin query helpers');
UPDATE database_version SET version = $upgrade_version, applied_at = strftime('%s', 'now') WHERE version = $upgrade_version - 1;

COMMIT;
