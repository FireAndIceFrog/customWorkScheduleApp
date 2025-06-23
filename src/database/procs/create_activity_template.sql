-- Create Activity Template Stored Procedure
-- Allows doctors to create recurring schedule patterns

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_activity_template(UUID, UUID, INTEGER, TIME, TIME, VARCHAR);

CREATE OR REPLACE FUNCTION create_activity_template(
    p_doctor_id UUID,
    p_room_id UUID,
    p_day_of_week INTEGER,
    p_start_time TIME,
    p_end_time TIME,
    p_template_name VARCHAR DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_template_id UUID;
    v_doctor_name TEXT;
    v_room_name TEXT;
    v_location_name TEXT;
    v_conflict_count INTEGER;
BEGIN
    -- Validate input parameters
    IF p_doctor_id IS NULL OR p_room_id IS NULL OR p_day_of_week IS NULL OR p_start_time IS NULL OR p_end_time IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Doctor ID, room ID, day of week, start time, and end time are required',
            'error_code', 'MISSING_PARAMETERS'
        );
    END IF;

    -- Validate day of week range
    IF p_day_of_week < 0 OR p_day_of_week > 6 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Day of week must be between 0 (Sunday) and 6 (Saturday)',
            'error_code', 'INVALID_DAY_OF_WEEK'
        );
    END IF;

    -- Validate time order
    IF p_start_time >= p_end_time THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Start time must be before end time',
            'error_code', 'INVALID_TIME_ORDER'
        );
    END IF;

    -- Check if doctor exists
    SELECT CONCAT(first_name, ' ', last_name) INTO v_doctor_name
    FROM doctors WHERE id = p_doctor_id;

    IF v_doctor_name IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Doctor not found',
            'error_code', 'DOCTOR_NOT_FOUND'
        );
    END IF;

    -- Check if room exists and get details
    SELECT r.room_name, l.location_name INTO v_room_name, v_location_name
    FROM rooms r
    JOIN locations l ON r.location_id = l.id
    WHERE r.id = p_room_id;

    IF v_room_name IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Room not found',
            'error_code', 'ROOM_NOT_FOUND'
        );
    END IF;

    -- Check for existing template conflicts (same doctor, day, overlapping times)
    SELECT COUNT(*) INTO v_conflict_count
    FROM activity_templates
    WHERE doctor_id = p_doctor_id
      AND day_of_week = p_day_of_week
      AND is_active = true
      AND (
          (start_time < p_end_time AND end_time > p_start_time)
      );

    IF v_conflict_count > 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Doctor already has a template for this day with overlapping times',
            'error_code', 'TEMPLATE_CONFLICT'
        );
    END IF;

    -- Check for room template conflicts (same room, day, overlapping times)
    SELECT COUNT(*) INTO v_conflict_count
    FROM activity_templates
    WHERE room_id = p_room_id
      AND day_of_week = p_day_of_week
      AND is_active = true
      AND (
          (start_time < p_end_time AND end_time > p_start_time)
      );

    IF v_conflict_count > 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Room already has a template for this day with overlapping times',
            'error_code', 'ROOM_TEMPLATE_CONFLICT'
        );
    END IF;

    -- Generate template name if not provided
    IF p_template_name IS NULL THEN
        p_template_name := v_doctor_name || ' - ' || 
                          CASE p_day_of_week
                              WHEN 0 THEN 'Sunday'
                              WHEN 1 THEN 'Monday'
                              WHEN 2 THEN 'Tuesday'
                              WHEN 3 THEN 'Wednesday'
                              WHEN 4 THEN 'Thursday'
                              WHEN 5 THEN 'Friday'
                              WHEN 6 THEN 'Saturday'
                          END || ' ' || 
                          p_start_time::TEXT || '-' || p_end_time::TEXT;
    END IF;

    -- Create the template
    INSERT INTO activity_templates (doctor_id, room_id, day_of_week, start_time, end_time, template_name)
    VALUES (p_doctor_id, p_room_id, p_day_of_week, p_start_time, p_end_time, p_template_name)
    RETURNING id INTO v_template_id;

    -- Return success response
    RETURN json_build_object(
        'success', true,
        'template_id', v_template_id,
        'doctor_name', v_doctor_name,
        'room_name', v_room_name,
        'location_name', v_location_name,
        'day_of_week', p_day_of_week,
        'day_name', CASE p_day_of_week
            WHEN 0 THEN 'Sunday'
            WHEN 1 THEN 'Monday'
            WHEN 2 THEN 'Tuesday'
            WHEN 3 THEN 'Wednesday'
            WHEN 4 THEN 'Thursday'
            WHEN 5 THEN 'Friday'
            WHEN 6 THEN 'Saturday'
        END,
        'start_time', p_start_time,
        'end_time', p_end_time,
        'template_name', p_template_name,
        'message', 'Activity template created successfully'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Database error: ' || SQLERRM,
            'error_code', 'DATABASE_ERROR'
        );
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_activity_template(UUID, UUID, INTEGER, TIME, TIME, VARCHAR) TO authenticated;
