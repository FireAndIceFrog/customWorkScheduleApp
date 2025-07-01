# Appointment and Template Management Features Implementation

## Overview
This document describes the implementation of the Activity Templates and Activities (Appointments) features, which form the core scheduling system for the medical centers. These features enable doctors to create recurring schedule templates and generate concrete activities automatically or manually.

## Architecture
Both features follow the established feature-first architecture with strict separation of concerns:

### Activity Templates Feature
```
src/server/src/rest/features/activity-templates/
├── controllers/
│   └── activity-templates.ts           # REST API endpoints
├── services/
│   ├── createTemplate.ts               # Create template business logic
│   ├── getTemplates.ts                 # List all templates
│   ├── getTemplate.ts                  # Get single template by ID
│   ├── getTemplatesByDoctor.ts         # Get templates by doctor
│   ├── updateTemplate.ts               # Update template business logic
│   ├── deleteTemplate.ts               # Delete template business logic
│   └── generateActivitiesFromTemplates.ts # Monthly generation logic
└── types/
    ├── ActivityTemplate.ts             # Template entity interface
    ├── CreateTemplateRequest.ts
    ├── UpdateTemplateRequest.ts
    ├── TemplateResponse.ts
    └── GenerationResult.ts             # Generation process results
```

### Activities Feature
```
src/server/src/rest/features/activities/
├── controllers/
│   └── activities.ts                   # REST API endpoints
├── services/
│   ├── createActivity.ts               # Create activity business logic
│   ├── getActivities.ts                # List activities with filtering
│   └── ... (additional services planned)
└── types/
    ├── Activity.ts                     # Activity entity interface
    ├── CreateActivityRequest.ts
    ├── UpdateActivityRequest.ts
    ├── ActivityResponse.ts
    └── ActivityFilter.ts               # Query filtering options
```

## Activity Templates API Endpoints

### GET /activity-templates
- **Description**: Retrieve all activity templates with doctor, room, and location information
- **Response**: List of templates ordered by doctor, day of week, and start time
- **Example**: `curl -X GET http://localhost:3000/activity-templates`

### GET /activity-templates/:id
- **Description**: Retrieve a specific template by ID with related information
- **Parameters**: `id` - Template UUID
- **Example**: `curl -X GET http://localhost:3000/activity-templates/[template-id]`

### GET /doctors/:doctorId/activity-templates
- **Description**: Retrieve all templates for a specific doctor
- **Parameters**: `doctorId` - Doctor UUID
- **Example**: `curl -X GET http://localhost:3000/doctors/[doctor-id]/activity-templates`

### POST /activity-templates
- **Description**: Create a new activity template
- **Body**: `CreateTemplateRequest`
- **Validation**: 
  - doctor_id, room_id, day_of_week, start_time, end_time are required
  - day_of_week must be 0-6 (0=Sunday, 6=Saturday)
  - Times must be in HH:MM format
  - start_time must be before end_time
  - No duplicate templates for same doctor/room/day/time
- **Example**: 
```bash
curl -X POST http://localhost:3000/activity-templates \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_id": "0197c33d-31ef-74ff-b2a6-b8aaf596580b",
    "room_id": "0197c355-b6e7-7609-ae6d-e94c72720085",
    "day_of_week": 1,
    "start_time": "09:00",
    "end_time": "13:00",
    "template_name": "Monday Morning Clinic"
  }'
```

### PUT /activity-templates/:id
- **Description**: Update an existing template
- **Parameters**: `id` - Template UUID
- **Body**: `UpdateTemplateRequest` (all fields optional)
- **Validation**: Same rules as creation, plus duplicate checking
- **Example**:
```bash
curl -X PUT http://localhost:3000/activity-templates/[template-id] \
  -H "Content-Type: application/json" \
  -d '{"template_name": "Updated Monday Clinic", "is_active": 0}'
```

### DELETE /activity-templates/:id
- **Description**: Delete a template
- **Parameters**: `id` - Template UUID
- **Validation**: Cannot delete templates with existing generated activities
- **Example**: `curl -X DELETE http://localhost:3000/activity-templates/[template-id]`

### POST /activity-templates/generate/:month
- **Description**: Generate activities for a specific month from active templates
- **Parameters**: `month` - Month in YYYY-MM format
- **Logic**:
  - Finds all active templates
  - Generates activities for matching days in the month
  - Skips generation on room conflicts
  - Logs the generation process
- **Example**: `curl -X POST http://localhost:3000/activity-templates/generate/2025-01`

## Activities (Appointments) API Endpoints

### GET /activities
- **Description**: Retrieve activities with optional filtering
- **Query Parameters**: All fields from `ActivityFilter` type
  - `doctor_id` - Filter by doctor
  - `room_id` - Filter by room
  - `start_date` / `end_date` - Date range (YYYY-MM-DD format)
  - `activity_type` - Filter by type (BOOKING, LEAVE, etc.)
  - `is_template_generated` - Filter by generation method (0/1)
  - `generation_month` - Filter by generation month (YYYY-MM)
- **Examples**:
```bash
curl -X GET http://localhost:3000/activities
curl -X GET "http://localhost:3000/activities?generation_month=2025-01"
curl -X GET "http://localhost:3000/activities?doctor_id=[doctor-id]&start_date=2025-01-01&end_date=2025-01-31"
```

### POST /activities
- **Description**: Create a new manual activity
- **Body**: `CreateActivityRequest`
- **Validation**: 
  - doctor_id, room_id, start_time, end_time are required (Unix timestamps)
  - start_time must be before end_time
  - No room conflicts with existing activities
- **Example**: 
```bash
curl -X POST http://localhost:3000/activities \
  -H "Content-Type: application/json" \
  -d '{
    "start_time": 1736109000,
    "end_time": 1736112600,
    "doctor_id": "[doctor-id]",
    "room_id": "[room-id]",
    "activity_type": "BOOKING",
    "notes": "Manual appointment"
  }'
```

## Key Features

### 1. Template-Based Recurring Schedules
- **Day of Week Patterns**: Templates specify recurring day patterns (0=Sunday to 6=Saturday)
- **Time Ranges**: HH:MM format for human-readable time entry
- **Active/Inactive States**: Templates can be deactivated without deletion
- **Conflict Prevention**: Unique constraints prevent duplicate templates

### 2. Automated Activity Generation
- **Monthly Processing**: Generate all activities for a calendar month from active templates
- **Date Calculation**: Automatically finds all matching days in the month
- **Timestamp Conversion**: Converts HH:MM template times to Unix timestamps for activities
- **Conflict Resolution**: Skips generation when room/time conflicts exist
- **Audit Trail**: Comprehensive logging of generation process and results

### 3. Manual Activity Creation
- **Direct Creation**: Doctors can create one-off activities outside of templates
- **Conflict Detection**: Prevents overlapping room bookings
- **Room Validation**: Ensures referenced doctors and rooms exist
- **Template Independence**: Manual activities don't interfere with template generation

### 4. Comprehensive Filtering and Querying
- **Multi-Field Filtering**: Activities can be filtered by doctor, room, date range, type, etc.
- **Date Range Queries**: Supports YYYY-MM-DD date format for easy integration
- **Generation Tracking**: Can distinguish between template-generated and manual activities
- **Template Linking**: Activities maintain links to their source templates

### 5. Referential Integrity
- **Template Protection**: Cannot delete templates with existing generated activities
- **Relationship Maintenance**: Activities maintain links to templates, doctors, rooms
- **Cascade Options**: Deactivate templates instead of deletion for data integrity
- **Foreign Key Validation**: All references validated before creation/updates

## Database Schema Integration

### Activity Templates Table
```sql
CREATE TABLE activity_templates (
    id TEXT PRIMARY KEY,
    doctor_id TEXT NOT NULL,
    room_id TEXT NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TEXT NOT NULL, -- HH:MM format
    end_time TEXT NOT NULL,   -- HH:MM format
    template_name TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(doctor_id, room_id, day_of_week, start_time, end_time)
);
```

### Extended Activities Table
```sql
-- Existing activities table extended with template columns
ALTER TABLE activities ADD COLUMN template_id TEXT REFERENCES activity_templates(id);
ALTER TABLE activities ADD COLUMN generation_month TEXT; -- YYYY-MM format
ALTER TABLE activities ADD COLUMN is_template_generated INTEGER DEFAULT 0;
```

### Generation Logs Table
```sql
CREATE TABLE generation_logs (
    id TEXT PRIMARY KEY,
    generation_month TEXT NOT NULL,
    total_templates_processed INTEGER NOT NULL DEFAULT 0,
    total_activities_generated INTEGER NOT NULL DEFAULT 0,
    total_conflicts_skipped INTEGER NOT NULL DEFAULT 0,
    generation_status TEXT DEFAULT 'COMPLETED',
    error_message TEXT,
    generated_at INTEGER NOT NULL,
    generated_by TEXT
);
```

## Testing Results

**Activity Templates:**
✅ **CREATE**: Successfully creates templates with comprehensive validation  
✅ **READ**: Lists templates with doctor/room/location information  
✅ **UPDATE**: Updates templates with duplicate detection  
✅ **DELETE**: Protects templates with existing activities  
✅ **GENERATION**: Generates 4 activities for January 2025 from 1 template  
✅ **CONFLICT DETECTION**: Properly skips conflicting time slots  

**Activities:**
✅ **CREATE**: Creates manual activities with room conflict detection  
✅ **READ**: Lists activities with comprehensive filtering  
✅ **FILTERING**: Successfully filters by generation month and other criteria  
✅ **CONFLICT PREVENTION**: Prevents overlapping room bookings  
✅ **TEMPLATE LINKING**: Generated activities maintain template relationships  

**Generation Process:**
✅ **Monthly Generation**: Successfully generated activities for January 2025  
✅ **Conflict Resolution**: Properly detected and prevented room conflicts  
✅ **Audit Logging**: Generation process logged with detailed results  
✅ **Template Processing**: Processed 1 template, generated 4 activities  

## Response Format
All endpoints return consistent response structures:

```typescript
interface TemplateResponse {
  success: boolean;
  message: string;
  template?: ActivityTemplate;
  templates?: ActivityTemplate[];
  errors?: string[];
}

interface ActivityResponse {
  success: boolean;
  message: string;
  activity?: Activity;
  activities?: Activity[];
  errors?: string[];
}

interface GenerationResult {
  success: boolean;
  message: string;
  generation_month: string;
  total_templates_processed: number;
  total_activities_generated: number;
  total_conflicts_skipped: number;
  errors?: string[];
  activities_generated?: any[];
  conflicts?: any[];
}
```

## Future Enhancements
- Complete Activities CRUD operations (update, delete, get by ID)
- Activities by doctor/room specific endpoints
- Bulk template operations
- Template scheduling rules (date ranges, holidays)
- Activity conflict resolution suggestions
- Template usage analytics
- Advanced filtering (time ranges, multiple doctors/rooms)
- Notification system for conflicts and changes
- Template versioning and history
- Automated monthly generation scheduling
