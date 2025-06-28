# Medical Center Scheduling Database Schema

## Overview
This SQLite database schema supports a medical center scheduling system for North Shore medical centers. It manages doctor schedules, room bookings, leave applications, and provides automated recurring activity generation through templates.

## Database Structure

### Core Tables
- **`doctors`** - Medical professionals who book time slots
- **`locations`** - Medical center locations (North Shore centers)
- **`rooms`** - Individual rooms within locations
- **`activities`** - Time slots booked by doctors (typically 4-hour blocks)
- **`leaves`** - Leave applications that block activities and require coverage

### Template System
- **`activity_templates`** - Recurring patterns for regular weekly schedules
- **`generation_logs`** - Tracks automated monthly generation process

### Utility Tables
- **`database_version`** - Version tracking for schema upgrades

## Quick Start

### 1. Initialize Database
```bash
# Create new database and apply all schema
sqlite3 scheduling.db < src/database/init.sql

# Load sample data for testing
sqlite3 scheduling.db < src/database/sample_data.sql
```

### 2. Key Admin Queries

#### Doctor Daily Schedule
```sql
-- View all bookings for a specific doctor on a specific day
SELECT * FROM v_doctor_daily_schedule 
WHERE doctor_name = 'Sarah Johnson' 
  AND activity_date = '2025-01-06'
ORDER BY start_time;
```

#### Doctor Weekly Schedule  
```sql
-- View doctor's weekly room assignments
SELECT * FROM v_doctor_weekly_schedule 
WHERE doctor_name = 'Michael Chen'
  AND activity_date BETWEEN '2025-01-06' AND '2025-01-12'
ORDER BY day_of_week, start_time;
```

#### Room Coverage Status
```sql
-- View room activities and coverage requirements
SELECT * FROM v_room_activities 
WHERE room_name = 'Consultation Room A'
  AND activity_date = '2025-01-09'
ORDER BY start_time;
```

#### Inbox Coverage Requirements
```sql
-- View doctors requiring inbox coverage due to leave
SELECT * FROM v_inbox_coverage 
WHERE leave_date >= date('now')
ORDER BY leave_date;
```

## Doctor Operations

### Create Activity Template (Regular Schedule)
```sql
-- Doctor creates recurring Monday morning clinic
INSERT INTO activity_templates (
    id, doctor_id, room_id, day_of_week, 
    start_time, end_time, template_name, is_active
) VALUES (
    'tmpl_new', 'dr_001', 'room_001', 1, 
    '09:00', '13:00', 'Monday Morning Clinic', 1
);
```

### Create Single Activity (One-time Booking)
```sql
-- Doctor books a specific time slot
INSERT INTO activities (
    id, start_time, end_time, doctor_id, room_id, 
    activity_type, notes, is_template_generated
) VALUES (
    'act_new',
    strftime('%s', '2025-01-15 09:00:00'),
    strftime('%s', '2025-01-15 13:00:00'),
    'dr_001', 'room_001', 
    'BOOKING', 'Special consultation', 0
);
```

### Apply for Leave
```sql
-- Step 1: Create leave activity (blocks the time)
INSERT INTO activities (
    id, start_time, end_time, doctor_id, room_id, 
    activity_type, notes
) VALUES (
    'act_leave',
    strftime('%s', '2025-01-20 00:00:00'),
    strftime('%s', '2025-01-20 23:59:59'),
    'dr_001', 'room_001', 
    'LEAVE', 'Personal leave'
);

-- Step 2: Create leave record
INSERT INTO leaves (
    id, activity_id, leave_type, reason, approval_status
) VALUES (
    'leave_new', 'act_leave', 'PERSONAL', 
    'Medical appointment', 'PENDING'
);
```

## Template System Workflows

### Monthly Generation Process
The system automatically generates concrete activities from templates at the start of each month:

```sql
-- Example: Generate activities for February 2025
-- (This would typically be done by an automated process)

-- Process all active templates for the month
INSERT INTO activities (
    id, start_time, end_time, doctor_id, room_id,
    activity_type, template_id, generation_month, is_template_generated
)
SELECT 
    'gen_' || at.id || '_' || strftime('%Y%m%d', date_series.date),
    strftime('%s', date_series.date || ' ' || at.start_time),
    strftime('%s', date_series.date || ' ' || at.end_time),
    at.doctor_id,
    at.room_id,
    'BOOKING',
    at.id,
    '2025-02',
    1
FROM activity_templates at
CROSS JOIN (
    -- Generate all dates in February 2025 that match template day_of_week
    WITH RECURSIVE dates(date) AS (
        SELECT '2025-02-01'
        UNION ALL
        SELECT date(date, '+1 day')
        FROM dates
        WHERE date < '2025-02-28'
    )
    SELECT date FROM dates
    WHERE CAST(strftime('%w', date) AS INTEGER) = at.day_of_week
) AS date_series
WHERE at.is_active = 1
  AND NOT EXISTS (
      -- Skip if room/time conflict exists
      SELECT 1 FROM activities a2 
      WHERE a2.room_id = at.room_id
        AND a2.start_time = strftime('%s', date_series.date || ' ' || at.start_time)
  );
```

## Database Views Reference

### `v_doctor_daily_schedule`
Shows bookings for doctors by day with room information. Displays "LEAVE" status for leave days.

**Columns:** `doctor_id`, `doctor_name`, `activity_date`, `start_time`, `end_time`, `room_name`, `room_number`, `location_name`, `status`, `notes`

### `v_doctor_weekly_schedule`
Shows doctor's room assignments by day of week. Used for weekly overview displays.

**Columns:** `doctor_id`, `doctor_name`, `day_of_week`, `day_name`, `activity_date`, `room_name`, `room_number`, `display_value`

### `v_room_activities`
Shows activities by room with coverage status. Displays "REQUIRING COVER" for rooms affected by leave.

**Columns:** `room_id`, `room_name`, `room_number`, `location_name`, `activity_date`, `start_time`, `end_time`, `doctor_name`, `coverage_status`, `notes`

### `v_inbox_coverage`
Shows doctors requiring inbox coverage due to approved/pending leave.

**Columns:** `doctor_id`, `doctor_name`, `email`, `leave_date`, `leave_type`, `reason`, `inbox_coverage_status`, `approval_status`

### `v_active_templates`
Shows all active recurring activity templates with readable formatting.

**Columns:** `template_id`, `doctor_name`, `room_name`, `room_number`, `location_name`, `day_name`, `start_time`, `end_time`, `template_name`, `created_date`

### `v_template_generation_summary`
Shows monthly generation statistics for monitoring the template system.

**Columns:** `generation_month`, `total_templates_processed`, `total_activities_generated`, `total_conflicts_skipped`, `generation_status`, `generated_date`, `success_rate_percent`

## Schema Versioning

The database uses a robust version control system to manage schema upgrades safely:

- **Version 1:** Core tables (doctors, locations, rooms, activities, leaves)
- **Version 2:** Activity templates and recurring system
- **Version 3:** Database views and admin helpers

### Version Control Behavior

Each schema file uses a minimal, clean version checking system:

- **Version Variable:** Each script starts with `.parameter set upgrade_version N`
- **Exact Match Required:** Script only applies if current database version is exactly `upgrade_version - 1`
- **Single Line Check:** `SELECT CASE WHEN COALESCE(MAX(version), 0) != $upgrade_version - 1 THEN RAISE(IGNORE) END FROM database_version;`
- **Safe & Simple:** Prevents downgrades, skipped versions, and duplicate operations

### Checking Database Version
```sql
SELECT version, description, 
       datetime(applied_at, 'unixepoch', 'localtime') as applied_at
FROM database_version 
ORDER BY version;
```

### Schema File Structure
```sql
-- Every schema file starts with this pattern:
.parameter set upgrade_version 2

BEGIN;
SELECT CASE WHEN COALESCE(MAX(version), 0) != $upgrade_version - 1 THEN RAISE(IGNORE) END FROM database_version;

-- ... schema changes ...

INSERT OR IGNORE INTO database_version (version, description) VALUES ($upgrade_version, 'Description');
UPDATE database_version SET version = $upgrade_version, applied_at = strftime('%s', 'now') WHERE version = $upgrade_version - 1;
COMMIT;
```

### Version Control Scenarios

| Database Version | Script Target | Result |
|------------------|---------------|---------|
| 0 (new DB) | Version 1 | ✅ Applied |
| 1 | Version 2 | ✅ Applied |
| 2 | Version 2 | ❌ Skipped (already applied) |
| 3 | Version 2 | ❌ Skipped (database newer) |
| 0 | Version 2 | ❌ Skipped (missing prerequisite) |

## Performance Considerations

### Key Indexes
- `idx_activities_doctor_time` - Doctor schedule queries
- `idx_activities_room_time` - Room availability queries  
- `idx_activities_time` - Time-based activity queries
- `idx_templates_doctor_active` - Template lookups
- `idx_leaves_status` - Leave status queries

### SQLite Optimizations
- Foreign keys enabled for referential integrity
- WAL mode for better concurrent access
- 64MB cache size for improved performance
- Unix timestamps for efficient date/time operations

## Common Patterns

### Check Room Availability
```sql
SELECT r.room_name, r.room_number
FROM rooms r
WHERE r.location_id = 'loc_001'
  AND NOT EXISTS (
    SELECT 1 FROM activities a 
    WHERE a.room_id = r.id
      AND a.start_time < strftime('%s', '2025-01-15 13:00:00')
      AND a.end_time > strftime('%s', '2025-01-15 09:00:00')
  );
```

### Find Conflicts
```sql
-- Find overlapping activities for same room
SELECT a1.id, a2.id, r.room_name
FROM activities a1
JOIN activities a2 ON a1.room_id = a2.room_id AND a1.id != a2.id
JOIN rooms r ON a1.room_id = r.id
WHERE a1.start_time < a2.end_time 
  AND a1.end_time > a2.start_time;
```

### Coverage Requirements
```sql
-- All activities requiring coverage (leave + no assigned cover)
SELECT a.*, d.first_name || ' ' || d.last_name as doctor_name
FROM activities a
JOIN doctors d ON a.doctor_id = d.id
JOIN leaves l ON l.activity_id = a.id
WHERE l.approval_status = 'APPROVED'
  AND l.dr_covering_inbox IS NULL;
```

## Troubleshooting

### Common Issues
1. **Foreign key constraint errors** - Ensure referenced records exist
2. **Unique constraint violations** - Check for duplicate room/time bookings  
3. **Template generation conflicts** - Review existing activities before generation
4. **Leave application issues** - Verify activity exists before creating leave record

### Database Integrity Check
```sql
PRAGMA integrity_check;
PRAGMA foreign_key_check;
```

### Reset Sample Data
```sql
-- Clear all data (preserve schema)
DELETE FROM leaves;
DELETE FROM activities;
DELETE FROM generation_logs; 
DELETE FROM activity_templates;
DELETE FROM doctors;
DELETE FROM rooms;
DELETE FROM locations;

-- Reload sample data
.read src/database/sample_data.sql
