# Medical Center Scheduling Database Schema

This database schema is designed for managing doctor schedules and leave applications at North Shore medical centers using Supabase PostgreSQL.

## Overview

The system allows doctors to create booking slots and apply for leave, while providing administrators with comprehensive views of schedules, room usage, and coverage requirements.

## Schema Structure

### Tables

- **doctors**: Medical professionals who book time slots
- **locations**: Medical center locations (North Shore centers)
- **rooms**: Individual rooms within locations where doctors see patients
- **activities**: Time slots booked by doctors (typically 4-hour blocks)
- **leave**: Leave applications that block activities and require inbox coverage

### Key Features

- **UUIDv7 primary keys** for all tables
- **Automatic timestamps** with created_at and updated_at fields
- **Foreign key constraints** ensuring data integrity
- **Row Level Security (RLS)** enabled for Supabase authentication
- **Comprehensive indexing** for optimal query performance
- **Business rule validation** through constraints

## Installation

Execute the schema files in order:

```sql
-- 1. Create tables and triggers
\i src/database/schema/01_create_tables.sql

-- 2. Create indexes for performance
\i src/database/schema/02_create_indexes.sql

-- 3. Add constraints and RLS policies
\i src/database/schema/03_create_constraints.sql

-- 4. Create stored procedures
\i src/database/procs/create_activity.sql
\i src/database/procs/get_doctor_schedule.sql
\i src/database/procs/get_doctor_weekly_rooms.sql
\i src/database/procs/get_room_activities.sql
```

## Stored Procedures

### 1. create_activity()

Creates a new activity with room conflict validation.

**Usage:**
```sql
SELECT create_activity(
    p_doctor_id := '123e4567-e89b-12d3-a456-426614174000',
    p_room_id := '123e4567-e89b-12d3-a456-426614174001',
    p_start_time := '2024-06-24 09:00:00+12',
    p_end_time := '2024-06-24 13:00:00+12'
);
```

**Response:**
```json
{
  "success": true,
  "activity_id": "123e4567-e89b-12d3-a456-426614174002",
  "doctor_name": "Dr. John Smith",
  "room_name": "Room 101",
  "start_time": "2024-06-24T09:00:00+12:00",
  "end_time": "2024-06-24T13:00:00+12:00",
  "message": "Activity created successfully"
}
```

### 2. get_doctor_schedule()

Gets a doctor's schedule for a specific day (Admin Query #1).

**Usage:**
```sql
SELECT get_doctor_schedule(
    p_doctor_id := '123e4567-e89b-12d3-a456-426614174000',
    p_date := '2024-06-24'
);
```

**Response:**
```json
{
  "success": true,
  "doctor_id": "123e4567-e89b-12d3-a456-426614174000",
  "doctor_name": "Dr. John Smith",
  "date": "2024-06-24",
  "status": "SCHEDULED",
  "activities": [
    {
      "activity_id": "123e4567-e89b-12d3-a456-426614174002",
      "start_time": "2024-06-24T09:00:00+12:00",
      "end_time": "2024-06-24T13:00:00+12:00",
      "room_name": "Room 101",
      "location_name": "North Shore Medical Center",
      "duration_hours": 4
    }
  ],
  "total_activities": 1,
  "total_hours": 4
}
```

### 3. get_doctor_weekly_rooms()

Gets a doctor's room assignments for a week (Admin Query #2).

**Usage:**
```sql
SELECT get_doctor_weekly_rooms(
    p_doctor_id := '123e4567-e89b-12d3-a456-426614174000',
    p_week_start := '2024-06-24'
);
```

**Response:**
```json
{
  "success": true,
  "doctor_id": "123e4567-e89b-12d3-a456-426614174000",
  "doctor_name": "Dr. John Smith",
  "week_start": "2024-06-24",
  "week_end": "2024-06-30",
  "weekly_schedule": [
    {
      "date": "2024-06-24",
      "day_name": "Monday",
      "status": "SCHEDULED",
      "rooms": [...],
      "total_hours": 4
    }
  ],
  "total_week_hours": 20,
  "days_on_leave": 0,
  "days_with_activities": 5
}
```

### 4. get_room_activities()

Gets activities for a specific room showing coverage needs (Admin Query #3).

**Usage:**
```sql
SELECT get_room_activities(
    p_room_id := '123e4567-e89b-12d3-a456-426614174001',
    p_date := '2024-06-24'
);
```

**Response:**
```json
{
  "success": true,
  "room_id": "123e4567-e89b-12d3-a456-426614174001",
  "room_name": "Room 101",
  "location_name": "North Shore Medical Center",
  "date": "2024-06-24",
  "activities": [
    {
      "activity_id": "123e4567-e89b-12d3-a456-426614174002",
      "doctor_name": "Dr. John Smith",
      "status": "REQUIRING COVER",
      "start_time": "2024-06-24T09:00:00+12:00",
      "end_time": "2024-06-24T13:00:00+12:00"
    }
  ],
  "summary": {
    "total_activities": 1,
    "requiring_cover": 1,
    "total_hours_booked": 4
  },
  "inbox_coverage_needed": true
}
```

### 5. get_rooms_requiring_cover()

Helper function to get all rooms requiring coverage for a date.

**Usage:**
```sql
SELECT get_rooms_requiring_cover(p_date := '2024-06-24');
```

## Common Workflows

### Creating a Doctor Schedule

1. Insert doctor record
2. Insert location and room records
3. Use `create_activity()` to create booking slots
4. Create leave applications by inserting into `leave` table

### Admin Dashboard Queries

1. **Daily Schedule View**: Use `get_doctor_schedule()` for each doctor
2. **Weekly Overview**: Use `get_doctor_weekly_rooms()` for weekly planning
3. **Room Management**: Use `get_room_activities()` to track room usage
4. **Coverage Alerts**: Use `get_rooms_requiring_cover()` for daily coverage overview

## Error Handling

All stored procedures return JSON responses with:
- `success`: boolean indicating operation success
- `error`: error message (if success is false)
- `error_code`: standardized error code for programmatic handling

Common error codes:
- `MISSING_PARAMETERS`: Required parameters not provided
- `ROOM_CONFLICT`: Room already booked for the time slot
- `DOCTOR_NOT_FOUND`: Invalid doctor ID
- `ROOM_NOT_FOUND`: Invalid room ID
- `DATABASE_ERROR`: Unexpected database error

## Security

- Row Level Security (RLS) enabled on all tables
- Basic policies allow authenticated users full access
- Modify policies based on your specific authentication requirements
- All stored procedures grant execute permissions to `authenticated` role

### 6. create_activity_template()

Creates recurring schedule patterns for doctors.

**Usage:**
```sql
SELECT create_activity_template(
    p_doctor_id := '123e4567-e89b-12d3-a456-426614174000',
    p_room_id := '123e4567-e89b-12d3-a456-426614174001',
    p_day_of_week := 1, -- Monday
    p_start_time := '09:00:00',
    p_end_time := '13:00:00',
    p_template_name := 'Monday Morning Clinic'
);
```

### 7. generate_monthly_activities()

Generates concrete activities from templates for a month.

**Usage:**
```sql
-- Generate for current month
SELECT generate_monthly_activities();

-- Generate for specific month
SELECT generate_monthly_activities('2024-07-01');
```

### 8. get_doctor_templates()

Gets all templates for a specific doctor.

**Usage:**
```sql
SELECT get_doctor_templates('123e4567-e89b-12d3-a456-426614174000');
```

### 9. update_activity_template()

Updates an existing activity template.

**Usage:**
```sql
SELECT update_activity_template(
    p_template_id := '123e4567-e89b-12d3-a456-426614174005',
    p_start_time := '08:00:00',
    p_end_time := '12:00:00'
);
```

### 10. get_generation_status()

Checks if monthly generation has been run for a month.

**Usage:**
```sql
SELECT get_generation_status('2024-07-01');
```

## Recurring Activities System

### Overview

The system includes a template-based recurring activities feature that allows doctors to create weekly schedule patterns that automatically generate concrete activities each month.

### Key Features

- **Activity Templates**: Store recurring patterns (day of week, time, room)
- **Monthly Generation**: Automatically create activities from templates
- **Conflict Resolution**: Skip generation when room/time conflicts exist
- **Leave Isolation**: Leave applications don't affect templates

### Template Workflows

#### Creating Templates
1. Doctor creates template specifying recurring pattern
2. System validates for conflicts with existing templates
3. Template becomes active and ready for generation

#### Monthly Generation Process
1. Run at start of each month (manually or via cron)
2. Process all active templates
3. Generate activities for matching days in the month
4. Skip generation if conflicts exist (suspend for that week)
5. Log generation results

#### Template Management
- View all templates for a doctor
- Update template details (time, room, etc.)
- Activate/deactivate templates
- Delete templates permanently

### Additional Tables

- **activity_templates**: Store recurring schedule patterns
- **generation_logs**: Track monthly generation runs
- **activities** (extended): Added template_id, generation_month, is_template_generated

## Performance Considerations

- Comprehensive indexing on foreign keys and time-based queries
- Partial indexes for leave-specific queries
- Composite indexes for room conflict checking
- Template-specific indexes for generation performance
- Consider partitioning activities table by date for large datasets
