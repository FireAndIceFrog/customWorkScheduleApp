-- Create Activity Stored Procedure with Room Conflict Validation
-- Prevents double-booking of rooms at overlapping times

CREATE OR REPLACE FUNCTION create_activity(
    p_doctor_id UUID,
    p_room_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_activity_id UUID;
    v_conflict_count INTEGER;
    v_conflict_details RECORD;
    v_doctor_name TEXT;
    v_room_name TEXT;
BEGIN
    -- Validate input parameters
    IF p_doctor_id IS NULL OR p_room_id IS NULL OR p_start_time IS NULL OR p_end_time IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'All parameters are required',
            'error_code', 'MISSING_PARAMETERS'
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

    -- Validate that start time is not in the past
    IF p_start_time < NOW() THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Cannot create activities in the past',
            'error_code', 'PAST_TIME'
        );
    END IF;

    -- Validate maximum duration (24 hours)
    IF p_end_time - p_start_time > INTERVAL '24 hours' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Activity duration cannot exceed 24 hours',
            'error_code', 'DURATION_TOO_LONG'
        );
    END IF;

    -- Check if doctor exists
    IF NOT EXISTS (SELECT 1 FROM doctors WHERE id = p_doctor_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Doctor not found',
            'error_code', 'DOCTOR_NOT_FOUND'
        );
    END IF;

    -- Check if room exists
    IF NOT EXISTS (SELECT 1 FROM rooms WHERE id = p_room_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Room not found',
            'error_code', 'ROOM_NOT_FOUND'
        );
    END IF;

    -- Check for room conflicts using timestamp overlap logic
    -- Two time ranges overlap if: start1 < end2 AND end1 > start2
    SELECT COUNT(*) INTO v_conflict_count
    FROM activities a
    WHERE a.room_id = p_room_id
      AND a.start_time < p_end_time
      AND a.end_time > p_start_time;

    -- If conflicts exist, get details for error message
    IF v_conflict_count > 0 THEN
        SELECT 
            d.first_name || ' ' || d.last_name as doctor_name,
            r.room_name,
            a.start_time,
            a.end_time
        INTO v_conflict_details
        FROM activities a
        JOIN doctors d ON a.doctor_id = d.id
        JOIN rooms r ON a.room_id = r.id
        WHERE a.room_id = p_room_id
          AND a.start_time < p_end_time
          AND a.end_time > p_start_time
        LIMIT 1;

        RETURN json_build_object(
            'success', false,
            'error', 'Room is already booked during this time',
            'error_code', 'ROOM_CONFLICT',
            'conflict_details', json_build_object(
                'existing_doctor', v_conflict_details.doctor_name,
                'room_name', v_conflict_details.room_name,
                'conflicting_start', v_conflict_details.start_time,
                'conflicting_end', v_conflict_details.end_time
            )
        );
    END IF;

    -- Create the activity
    INSERT INTO activities (doctor_id, room_id, start_time, end_time)
    VALUES (p_doctor_id, p_room_id, p_start_time, p_end_time)
    RETURNING id INTO v_activity_id;

    -- Get names for response
    SELECT d.first_name || ' ' || d.last_name INTO v_doctor_name
    FROM doctors d WHERE d.id = p_doctor_id;

    SELECT r.room_name INTO v_room_name
    FROM rooms r WHERE r.id = p_room_id;

    -- Return success response
    RETURN json_build_object(
        'success', true,
        'activity_id', v_activity_id,
        'doctor_name', v_doctor_name,
        'room_name', v_room_name,
        'start_time', p_start_time,
        'end_time', p_end_time,
        'message', 'Activity created successfully'
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
GRANT EXECUTE ON FUNCTION create_activity(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
