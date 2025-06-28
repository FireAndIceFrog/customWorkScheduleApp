-- Sample Data for Medical Center Scheduling System
-- Provides test data for development and demonstration purposes
-- Safe to run multiple times - uses INSERT OR IGNORE

-- Sample Locations (North Shore Medical Centers)
INSERT OR IGNORE INTO locations (id, location_name, location_key, address) VALUES
('loc_001', 'North Shore Medical Center - Main', 'NSMC_MAIN', '123 Main Street, North Shore'),
('loc_002', 'North Shore Medical Center - East', 'NSMC_EAST', '456 East Avenue, North Shore'),
('loc_003', 'North Shore Medical Center - West', 'NSMC_WEST', '789 West Road, North Shore');

-- Sample Rooms
INSERT OR IGNORE INTO rooms (id, room_name, room_number, location_id, capacity) VALUES
-- Main location rooms
('room_001', 'Consultation Room A', '101', 'loc_001', 1),
('room_002', 'Consultation Room B', '102', 'loc_001', 1),
('room_003', 'Consultation Room C', '103', 'loc_001', 1),
('room_004', 'Treatment Room 1', '201', 'loc_001', 2),
('room_005', 'Treatment Room 2', '202', 'loc_001', 2),
-- East location rooms
('room_006', 'Consultation Room D', '101', 'loc_002', 1),
('room_007', 'Consultation Room E', '102', 'loc_002', 1),
('room_008', 'Minor Procedures', '201', 'loc_002', 1),
-- West location rooms
('room_009', 'Consultation Room F', '101', 'loc_003', 1),
('room_010', 'Consultation Room G', '102', 'loc_003', 1);

-- Sample Doctors
INSERT OR IGNORE INTO doctors (id, first_name, last_name, email) VALUES
('dr_001', 'Sarah', 'Johnson', 'sarah.johnson@nsmc.com'),
('dr_002', 'Michael', 'Chen', 'michael.chen@nsmc.com'),
('dr_003', 'Emma', 'Williams', 'emma.williams@nsmc.com'),
('dr_004', 'David', 'Brown', 'david.brown@nsmc.com'),
('dr_005', 'Lisa', 'Davis', 'lisa.davis@nsmc.com'),
('dr_006', 'James', 'Wilson', 'james.wilson@nsmc.com'),
('dr_007', 'Anna', 'Taylor', 'anna.taylor@nsmc.com'),
('dr_008', 'Robert', 'Anderson', 'robert.anderson@nsmc.com');

-- Sample Activity Templates (Regular Weekly Schedules)
-- Dr. Johnson's regular schedule
INSERT OR IGNORE INTO activity_templates (id, doctor_id, room_id, day_of_week, start_time, end_time, template_name, is_active) VALUES
('tmpl_001', 'dr_001', 'room_001', 1, '09:00', '13:00', 'Monday Morning Clinic', 1),
('tmpl_002', 'dr_001', 'room_001', 3, '14:00', '18:00', 'Wednesday Afternoon Clinic', 1),
('tmpl_003', 'dr_001', 'room_001', 5, '09:00', '13:00', 'Friday Morning Clinic', 1);

-- Dr. Chen's regular schedule
INSERT OR IGNORE INTO activity_templates (id, doctor_id, room_id, day_of_week, start_time, end_time, template_name, is_active) VALUES
('tmpl_004', 'dr_002', 'room_002', 2, '08:00', '12:00', 'Tuesday Morning Clinic', 1),
('tmpl_005', 'dr_002', 'room_002', 4, '13:00', '17:00', 'Thursday Afternoon Clinic', 1),
('tmpl_006', 'dr_002', 'room_004', 1, '14:00', '18:00', 'Monday Treatment Sessions', 1);

-- Dr. Williams' regular schedule
INSERT OR IGNORE INTO activity_templates (id, doctor_id, room_id, day_of_week, start_time, end_time, template_name, is_active) VALUES
('tmpl_007', 'dr_003', 'room_003', 1, '09:00', '13:00', 'Monday Consultations', 1),
('tmpl_008', 'dr_003', 'room_003', 2, '14:00', '18:00', 'Tuesday Afternoon Clinic', 1),
('tmpl_009', 'dr_003', 'room_006', 4, '09:00', '13:00', 'Thursday East Location', 1);

-- Sample Activities for Current Week (manually created, not template-generated)
-- These represent specific bookings for the current week
INSERT OR IGNORE INTO activities (id, start_time, end_time, doctor_id, room_id, activity_type, notes, is_template_generated) VALUES
-- This week's Monday activities
('act_001', 
 strftime('%s', 'now', 'weekday 1', '09:00'), 
 strftime('%s', 'now', 'weekday 1', '13:00'), 
 'dr_001', 'room_001', 'BOOKING', 'Regular Monday clinic', 0),
 
('act_002', 
 strftime('%s', 'now', 'weekday 1', '14:00'), 
 strftime('%s', 'now', 'weekday 1', '18:00'), 
 'dr_002', 'room_004', 'BOOKING', 'Treatment sessions', 0),

-- This week's Tuesday activities  
('act_003', 
 strftime('%s', 'now', 'weekday 2', '08:00'), 
 strftime('%s', 'now', 'weekday 2', '12:00'), 
 'dr_002', 'room_002', 'BOOKING', 'Tuesday morning clinic', 0),
 
('act_004', 
 strftime('%s', 'now', 'weekday 2', '14:00'), 
 strftime('%s', 'now', 'weekday 2', '18:00'), 
 'dr_003', 'room_003', 'BOOKING', 'Afternoon consultations', 0),

-- This week's Wednesday activities
('act_005', 
 strftime('%s', 'now', 'weekday 3', '14:00'), 
 strftime('%s', 'now', 'weekday 3', '18:00'), 
 'dr_001', 'room_001', 'BOOKING', 'Wednesday afternoon clinic', 0),

-- This week's Thursday activities
('act_006', 
 strftime('%s', 'now', 'weekday 4', '13:00'), 
 strftime('%s', 'now', 'weekday 4', '17:00'), 
 'dr_002', 'room_002', 'BOOKING', 'Thursday afternoon clinic', 0),
 
('act_007', 
 strftime('%s', 'now', 'weekday 4', '09:00'), 
 strftime('%s', 'now', 'weekday 4', '13:00'), 
 'dr_003', 'room_006', 'BOOKING', 'East location morning', 0),

-- This week's Friday activities
('act_008', 
 strftime('%s', 'now', 'weekday 5', '09:00'), 
 strftime('%s', 'now', 'weekday 5', '13:00'), 
 'dr_001', 'room_001', 'BOOKING', 'Friday morning clinic', 0);

-- Sample Leave Application
-- Dr. Chen taking leave on Thursday (requiring cover)
INSERT OR IGNORE INTO leaves (id, activity_id, leave_type, reason, approval_status) VALUES
('leave_001', 'act_006', 'PERSONAL', 'Medical appointment', 'APPROVED');

-- Sample Generation Log (showing template system was run)
INSERT OR IGNORE INTO generation_logs (id, generation_month, total_templates_processed, total_activities_generated, total_conflicts_skipped, generation_status, generated_by) VALUES
('gen_001', '2025-01', 9, 36, 2, 'COMPLETED', 'SYSTEM_CRON');

-- Update activities to show some were template-generated
UPDATE activities 
SET template_id = 'tmpl_001', generation_month = '2025-01', is_template_generated = 1 
WHERE id = 'act_001';

UPDATE activities 
SET template_id = 'tmpl_004', generation_month = '2025-01', is_template_generated = 1 
WHERE id = 'act_003';

UPDATE activities 
SET template_id = 'tmpl_002', generation_month = '2025-01', is_template_generated = 1 
WHERE id = 'act_005';
