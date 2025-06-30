-- Database version tracking table
-- This ensures we can safely upgrade the database schema over time
CREATE TABLE IF NOT EXISTS database_version (
    version INTEGER PRIMARY KEY,
    applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')), -- Unix timestamp
    description TEXT
);

-- Insert initial version if not exists
INSERT OR IGNORE INTO database_version (version, description) 
VALUES (1, 'Initial schema with core tables');

-- Doctors table - medical professionals who book time slots
CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY, -- UUID as TEXT (SQLite optimization)
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE, -- For future inbox management features
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Locations table - medical center locations (North Shore centers)
CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    location_name TEXT NOT NULL,
    location_key TEXT UNIQUE NOT NULL, -- Short identifier for easy reference
    address TEXT, -- Physical address for future features
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Rooms table - individual rooms within locations where doctors see patients
CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    room_name TEXT NOT NULL,
    room_number TEXT, -- Display-friendly room identifier
    location_id TEXT NOT NULL,
    capacity INTEGER DEFAULT 1, -- Future-proofing for group sessions
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
);

-- Activities table - time slots booked by doctors (typically 4-hour blocks)
-- This is the core scheduling entity
CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    start_time INTEGER NOT NULL, -- Unix timestamp for precise scheduling
    end_time INTEGER NOT NULL,
    doctor_id TEXT NOT NULL,
    room_id TEXT NOT NULL,
    activity_type TEXT DEFAULT 'BOOKING', -- BOOKING, LEAVE, etc.
    notes TEXT, -- Optional scheduling notes
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    -- Prevent overlapping bookings for same room
    UNIQUE(room_id, start_time, end_time)
);

-- Leave table - leave applications that block activities and require inbox coverage
-- Links to activities to maintain referential integrity
CREATE TABLE IF NOT EXISTS leaves (
    id TEXT PRIMARY KEY,
    activity_id TEXT NOT NULL UNIQUE, -- One leave per activity
    leave_type TEXT DEFAULT 'PERSONAL', -- PERSONAL, SICK, VACATION, etc.
    reason TEXT, -- Optional leave reason
    dr_covering_inbox TEXT, -- Doctor covering inbox duties (can be null initially)
    approval_status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, DENIED
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (dr_covering_inbox) REFERENCES doctors(id) ON DELETE SET NULL
);

-- Indexes for performance optimization
-- These support the main query patterns described in the requirements

-- Doctor schedule queries (by doctor and date range)
CREATE INDEX IF NOT EXISTS idx_activities_doctor_time ON activities(doctor_id, start_time, end_time);

-- Room availability queries (by room and date range)
CREATE INDEX IF NOT EXISTS idx_activities_room_time ON activities(room_id, start_time, end_time);

-- Leave status queries
CREATE INDEX IF NOT EXISTS idx_leaves_status ON leaves(approval_status);

-- Location-based room lookups
CREATE INDEX IF NOT EXISTS idx_rooms_location ON rooms(location_id);

-- Doctor name searches
CREATE INDEX IF NOT EXISTS idx_doctors_name ON doctors(last_name, first_name);

-- Time-based activity queries (for daily/weekly views)
CREATE INDEX IF NOT EXISTS idx_activities_time ON activities(start_time, end_time);

-- Update database version to reflect this schema is applied
UPDATE database_version SET version = 1 WHERE version < 1;