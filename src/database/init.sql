-- Database Initialization Script
-- Executes all schema files in order to create a complete database
-- Safe to run multiple times - all operations are idempotent

-- This script should be executed to set up a new database or upgrade an existing one
-- It will process all schema files in the correct sequence

PRAGMA foreign_keys = ON;

-- Enable Write-Ahead Logging for better performance with concurrent access
PRAGMA journal_mode = WAL;

-- Set synchronous mode for better performance while maintaining data integrity
PRAGMA synchronous = NORMAL;

-- Optimize SQLite settings for this application
PRAGMA cache_size = -64000; -- 64MB cache
PRAGMA temp_store = MEMORY;

-- Execute schema files in order
-- Each file checks version before applying changes

-- Schema 001: Core tables (doctors, locations, rooms, activities, leaves)
.read src/database/schema/001_initial_schema.sql

-- Schema 002: Activity templates and recurring activities system  
.read src/database/schema/002_activity_templates.sql

-- Schema 003: Database views and admin query helpers
.read src/database/schema/003_views_and_functions.sql

-- Verify database integrity after initialization
PRAGMA integrity_check;

-- Display final database version and applied schemas
SELECT 
    'Database initialization complete' as status,
    MAX(version) as current_version,
    COUNT(*) as total_schema_versions
FROM database_version;

-- Show all applied schema versions
SELECT 
    version,
    description,
    datetime(applied_at, 'unixepoch', 'localtime') as applied_at
FROM database_version 
ORDER BY version;

-- Basic sanity check - show table count
SELECT 
    COUNT(*) as total_tables,
    (SELECT COUNT(*) FROM sqlite_master WHERE type='view') as total_views,
    (SELECT COUNT(*) FROM sqlite_master WHERE type='index') as total_indexes
FROM sqlite_master 
WHERE type='table' AND name NOT LIKE 'sqlite_%';
