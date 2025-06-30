# Doctor Feature Implementation

## Overview
This document describes the implementation of the Doctor feature following the same architectural patterns as the Settings feature.

## Architecture
The Doctor feature follows a clean, feature-first architecture with strict separation of concerns:

```
src/server/src/rest/features/doctors/
├── controllers/
│   └── doctors.ts          # REST API endpoints
├── services/
│   ├── createDoctor.ts     # Create doctor business logic
│   ├── getDoctors.ts       # List all doctors
│   ├── getDoctor.ts        # Get single doctor by ID
│   ├── updateDoctor.ts     # Update doctor business logic
│   └── deleteDoctor.ts     # Delete doctor business logic
└── types/
    ├── Doctor.ts           # Doctor entity interface
    ├── CreateDoctorRequest.ts
    ├── UpdateDoctorRequest.ts
    └── DoctorResponse.ts   # Standardized API response
```

## API Endpoints

### GET /doctors
- **Description**: Retrieve all doctors
- **Response**: List of doctors ordered by last name, first name
- **Example**: `curl -X GET http://localhost:3000/doctors`

### GET /doctors/:id
- **Description**: Retrieve a specific doctor by ID
- **Parameters**: `id` - Doctor UUID
- **Example**: `curl -X GET http://localhost:3000/doctors/0197c33d-31ef-74ff-b2a6-b8aaf596580b`

### POST /doctors
- **Description**: Create a new doctor
- **Body**: `CreateDoctorRequest` (first_name, last_name, email?)
- **Validation**: 
  - first_name and last_name are required
  - email must be unique if provided
- **Example**: 
```bash
curl -X POST http://localhost:3000/doctors \
  -H "Content-Type: application/json" \
  -d '{"first_name": "John", "last_name": "Smith", "email": "john.smith@example.com"}'
```

### PUT /doctors/:id
- **Description**: Update an existing doctor
- **Parameters**: `id` - Doctor UUID
- **Body**: `UpdateDoctorRequest` (first_name?, last_name?, email?)
- **Validation**:
  - At least one field must be provided
  - Email must be unique if changed
- **Example**:
```bash
curl -X PUT http://localhost:3000/doctors/0197c33d-31ef-74ff-b2a6-b8aaf596580b \
  -H "Content-Type: application/json" \
  -d '{"first_name": "Jane", "last_name": "Doe"}'
```

### DELETE /doctors/:id
- **Description**: Delete a doctor
- **Parameters**: `id` - Doctor UUID
- **Validation**: Cannot delete doctors with existing activities
- **Example**: `curl -X DELETE http://localhost:3000/doctors/0197c33d-31ef-74ff-b2a6-b8aaf596580b`

## Key Features

### 1. Strict TypeScript Typing
- All interfaces are strictly typed
- Proper error handling with typed responses
- Consistent API response structure

### 2. UUID Generation
- Uses `uuidv7` for sortable, timestamp-based UUIDs
- Follows the project's UUID standard

### 3. Database Integration
- Uses existing database utilities (`dbGet`, `dbAll`, `dbRun`)
- Proper parameterized queries to prevent SQL injection
- Timestamps stored as Unix timestamps for consistency

### 4. Validation & Error Handling
- Input validation at service layer
- Unique email constraint enforcement
- Referential integrity protection (cannot delete doctors with activities)
- Consistent error response format

### 5. Business Logic Separation
- Controllers handle HTTP concerns only
- Services contain all business logic
- Clean separation between layers

## Database Schema
The Doctor feature uses the existing `doctors` table from the database schema:

```sql
CREATE TABLE doctors (
    id TEXT PRIMARY KEY,           -- UUID as TEXT
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE,            -- Optional, unique constraint
    created_at INTEGER NOT NULL,  -- Unix timestamp
    updated_at INTEGER NOT NULL   -- Unix timestamp
);
```

## Integration
The Doctor feature is integrated into the main application via:

1. **app.ts**: DoctorsController registered alongside other controllers
2. **Express middleware**: JSON parsing middleware added for POST/PUT requests
3. **Database**: Uses existing database connection and utilities

## Testing Results
All CRUD operations have been tested and verified:

✅ **CREATE**: Successfully creates doctors with validation  
✅ **READ**: Lists all doctors and retrieves individual doctors  
✅ **UPDATE**: Updates doctor fields with proper validation  
✅ **DELETE**: Deletes doctors with referential integrity checks  
✅ **ERROR HANDLING**: Proper error responses for invalid operations  

## Response Format
All endpoints return a consistent response structure:

```typescript
interface DoctorResponse {
  success: boolean;
  message: string;
  doctor?: Doctor;      // For single doctor operations
  doctors?: Doctor[];   // For list operations
  errors?: string[];    // For validation/error details
}
```

## Future Enhancements
- Add pagination for large doctor lists
- Add search/filter functionality
- Add bulk operations
- Add doctor specialization fields
- Add soft delete functionality
