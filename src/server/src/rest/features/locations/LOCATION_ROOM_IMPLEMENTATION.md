# Location and Room Management Features Implementation

## Overview
This document describes the implementation of the Location and Room management features following the same architectural patterns as the Settings and Doctor features.

## Architecture
Both features follow a clean, feature-first architecture with strict separation of concerns:

### Location Management Feature
```
src/server/src/rest/features/locations/
├── controllers/
│   └── locations.ts        # REST API endpoints
├── services/
│   ├── createLocation.ts   # Create location business logic
│   ├── getLocations.ts     # List all locations
│   ├── getLocation.ts      # Get single location by ID
│   ├── updateLocation.ts   # Update location business logic
│   └── deleteLocation.ts   # Delete location business logic
└── types/
    ├── Location.ts         # Location entity interface
    ├── CreateLocationRequest.ts
    ├── UpdateLocationRequest.ts
    └── LocationResponse.ts # Standardized API response
```

### Room Management Feature
```
src/server/src/rest/features/rooms/
├── controllers/
│   └── rooms.ts            # REST API endpoints
├── services/
│   ├── createRoom.ts       # Create room business logic
│   ├── getRooms.ts         # List all rooms
│   ├── getRoom.ts          # Get single room by ID
│   ├── getRoomsByLocation.ts # Get rooms by location
│   ├── updateRoom.ts       # Update room business logic
│   └── deleteRoom.ts       # Delete room business logic
└── types/
    ├── Room.ts             # Room entity interface
    ├── CreateRoomRequest.ts
    ├── UpdateRoomRequest.ts
    └── RoomResponse.ts     # Standardized API response
```

## Location API Endpoints

### GET /locations
- **Description**: Retrieve all locations
- **Response**: List of locations ordered by location name
- **Example**: `curl -X GET http://localhost:3000/locations`

### GET /locations/:id
- **Description**: Retrieve a specific location by ID
- **Parameters**: `id` - Location UUID
- **Example**: `curl -X GET http://localhost:3000/locations/0197c355-8bea-76f0-aec7-daf5f7aba2c0`

### POST /locations
- **Description**: Create a new location
- **Body**: `CreateLocationRequest` (location_name, location_key, address?)
- **Validation**: 
  - location_name and location_key are required
  - location_key must be unique
- **Example**: 
```bash
curl -X POST http://localhost:3000/locations \
  -H "Content-Type: application/json" \
  -d '{"location_name": "North Shore Medical Center", "location_key": "NSMC", "address": "123 Medical Drive"}'
```

### PUT /locations/:id
- **Description**: Update an existing location
- **Parameters**: `id` - Location UUID
- **Body**: `UpdateLocationRequest` (location_name?, location_key?, address?)
- **Validation**:
  - At least one field must be provided
  - location_key must be unique if changed
- **Example**:
```bash
curl -X PUT http://localhost:3000/locations/0197c355-8bea-76f0-aec7-daf5f7aba2c0 \
  -H "Content-Type: application/json" \
  -d '{"location_name": "North Shore Medical Center - Main Campus"}'
```

### DELETE /locations/:id
- **Description**: Delete a location
- **Parameters**: `id` - Location UUID
- **Validation**: Cannot delete locations with existing rooms
- **Example**: `curl -X DELETE http://localhost:3000/locations/0197c355-8bea-76f0-aec7-daf5f7aba2c0`

## Room API Endpoints

### GET /rooms
- **Description**: Retrieve all rooms with location information
- **Response**: List of rooms ordered by location name, then room name
- **Example**: `curl -X GET http://localhost:3000/rooms`

### GET /rooms/:id
- **Description**: Retrieve a specific room by ID with location information
- **Parameters**: `id` - Room UUID
- **Example**: `curl -X GET http://localhost:3000/rooms/0197c355-b6e7-7609-ae6d-e94c72720085`

### GET /locations/:locationId/rooms
- **Description**: Retrieve all rooms for a specific location
- **Parameters**: `locationId` - Location UUID
- **Example**: `curl -X GET http://localhost:3000/locations/0197c355-8bea-76f0-aec7-daf5f7aba2c0/rooms`

### POST /rooms
- **Description**: Create a new room
- **Body**: `CreateRoomRequest` (room_name, location_id, room_number?, capacity?)
- **Validation**: 
  - room_name and location_id are required
  - location_id must exist
  - capacity defaults to 1
- **Example**: 
```bash
curl -X POST http://localhost:3000/rooms \
  -H "Content-Type: application/json" \
  -d '{"room_name": "Consultation Room A", "room_number": "101", "location_id": "0197c355-8bea-76f0-aec7-daf5f7aba2c0", "capacity": 2}'
```

### PUT /rooms/:id
- **Description**: Update an existing room
- **Parameters**: `id` - Room UUID
- **Body**: `UpdateRoomRequest` (room_name?, room_number?, location_id?, capacity?)
- **Validation**:
  - At least one field must be provided
  - location_id must exist if changed
- **Example**:
```bash
curl -X PUT http://localhost:3000/rooms/0197c355-b6e7-7609-ae6d-e94c72720085 \
  -H "Content-Type: application/json" \
  -d '{"room_name": "Consultation Room A - Updated", "capacity": 3}'
```

### DELETE /rooms/:id
- **Description**: Delete a room
- **Parameters**: `id` - Room UUID
- **Validation**: Cannot delete rooms with existing activities
- **Example**: `curl -X DELETE http://localhost:3000/rooms/0197c355-b6e7-7609-ae6d-e94c72720085`

## Key Features

### 1. Hierarchical Relationship
- Rooms belong to locations (foreign key relationship)
- Rooms include location information in responses via JOIN queries
- Dedicated endpoint for retrieving rooms by location

### 2. Referential Integrity
- Cannot delete locations that have associated rooms
- Cannot delete rooms that have associated activities
- Location validation when creating/updating rooms
- Proper error messages for constraint violations

### 3. Enhanced Queries
- Room queries include location_name via JOIN operations
- Efficient ordering: locations by name, rooms by location then name
- Optimized for common UI patterns (location → rooms hierarchy)

### 4. Strict TypeScript Typing
- All interfaces are strictly typed
- Proper error handling with typed responses
- Consistent API response structure across both features

### 5. UUID Generation
- Uses `uuidv7` for sortable, timestamp-based UUIDs
- Follows the project's UUID standard for both entities

### 6. Database Integration
- Uses existing database utilities (`dbGet`, `dbAll`, `dbRun`)
- Proper parameterized queries to prevent SQL injection
- Timestamps stored as Unix timestamps for consistency

## Database Schema
Both features use existing database tables:

### Locations Table
```sql
CREATE TABLE locations (
    id TEXT PRIMARY KEY,           -- UUID as TEXT
    location_name TEXT NOT NULL,
    location_key TEXT UNIQUE NOT NULL, -- Short identifier
    address TEXT,                  -- Optional address
    created_at INTEGER NOT NULL,   -- Unix timestamp
    updated_at INTEGER NOT NULL    -- Unix timestamp
);
```

### Rooms Table
```sql
CREATE TABLE rooms (
    id TEXT PRIMARY KEY,           -- UUID as TEXT
    room_name TEXT NOT NULL,
    room_number TEXT,             -- Display-friendly identifier
    location_id TEXT NOT NULL,    -- Foreign key to locations
    capacity INTEGER DEFAULT 1,   -- Room capacity
    created_at INTEGER NOT NULL,  -- Unix timestamp
    updated_at INTEGER NOT NULL,  -- Unix timestamp
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
);
```

## Integration
Both features are integrated into the main application via:

1. **app.ts**: Both LocationsController and RoomsController registered
2. **Express middleware**: JSON parsing middleware supports POST/PUT requests
3. **Database**: Uses existing database connection and utilities

## Testing Results
All CRUD operations have been tested and verified for both features:

**Locations:**
✅ **CREATE**: Successfully creates locations with validation  
✅ **READ**: Lists all locations and retrieves individual locations  
✅ **UPDATE**: Updates location fields with proper validation  
✅ **DELETE**: Deletes locations with referential integrity checks  
✅ **ERROR HANDLING**: Proper error responses for invalid operations  

**Rooms:**
✅ **CREATE**: Successfully creates rooms with location validation  
✅ **READ**: Lists all rooms, retrieves individual rooms, and rooms by location  
✅ **UPDATE**: Updates room fields with proper validation  
✅ **DELETE**: Deletes rooms with referential integrity checks  
✅ **RELATIONSHIPS**: Properly handles location-room relationships  
✅ **ERROR HANDLING**: Proper error responses for invalid operations  

## Response Format
Both endpoints return consistent response structures:

```typescript
interface LocationResponse {
  success: boolean;
  message: string;
  location?: Location;      // For single location operations
  locations?: Location[];   // For list operations
  errors?: string[];        // For validation/error details
}

interface RoomResponse {
  success: boolean;
  message: string;
  room?: Room;             // For single room operations
  rooms?: Room[];          // For list operations
  errors?: string[];       // For validation/error details
}
```

## Future Enhancements
- Add pagination for large lists
- Add search/filter functionality
- Add bulk operations
- Add room availability queries
- Add room booking conflict detection
- Add soft delete functionality
- Add room equipment/features tracking
