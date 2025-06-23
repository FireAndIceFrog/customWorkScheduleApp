-- Get Doctor Schedule Stored Procedure
-- Admin Query #1: Get doctor's bookings for a specific day with room information

CREATE OR REPLACE FUNCTION get_doctor_schedule(
    p_doctor_id UUID,
    p_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_doctor_name TEXT;
    v_schedule_data JSON;
    v_activities JSON[];
    v_activity RECORD;
    v_leave_exists BOOLEAN := false;
BEGIN
    -- Validate input parameters
    IF p_doctor_id IS NULL OR p_date IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Doctor ID and date are required',
            'error_code', 'MISSING_PARAMETERS'
        );
    END IF;

    -- Check if doctor exists and get name
    SELECT CONCAT(first_name, ' ', last_name) INTO v_doctor_name
    FROM doctors 
    WHERE id = p_doctor_id;

    IF v_doctor_name IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Doctor not found',
            'error_code', 'DOCTOR_NOT_FOUND'
        );
    END IF;

    -- Check if doctor has any leave activities for this date
    SELECT EXISTS(
        SELECT 1 
        FROM activities a
        JOIN leave l ON a.id = l.activity_id
        WHERE a.doctor_id = p_doctor_id
          AND DATE(a.start_time) = p_date
    ) INTO v_leave_exists;

    -- If doctor is on leave, return leave status
    IF v_leave_exists THEN
        RETURN json_build_object(
            'success', true,
            'doctor_id', p_doctor_id,
            'doctor_name', v_doctor_name,
            'date', p_date,
            'status', 'LEAVE',
            'activities', '[]'::json,
            'message', 'Doctor is on leave for this day'
        );
    END IF;

    -- Get all activities for the doctor on the specified date
    SELECT array_agg(
        json_build_object(
            'activity_id', a.id,
            'start_time', a.start_time,
            'end_time', a.end_time,
            'room_id', r.id,
            'room_name', r.room_name,
            'location_name', l.location_name,
            'location_key', l.location_key,
            'duration_hours', EXTRACT(EPOCH FROM (a.end_time - a.start_time)) / 3600
        ) ORDER BY a.start_time
    ) INTO v_activities
    FROM activities a
    JOIN rooms r ON a.room_id = r.id
    JOIN locations l ON r.location_id = l.id
    WHERE a.doctor_id = p_doctor_id
      AND DATE(a.start_time) = p_date
      AND NOT EXISTS (
          SELECT 1 FROM leave lv WHERE lv.activity_id = a.id
      );

    -- Build the response
    RETURN json_build_object(
        'success', true,
        'doctor_id', p_doctor_id,
        'doctor_name', v_doctor_name,
        'date', p_date,
        'status', CASE 
            WHEN v_activities IS NULL OR array_length(v_activities, 1) = 0 THEN 'NO_ACTIVITIES'
            ELSE 'SCHEDULED'
        END,
        'activities', COALESCE(array_to_json(v_activities), '[]'::json),
        'total_activities', COALESCE(array_length(v_activities, 1), 0),
        'total_hours', COALESCE((
            SELECT SUM(EXTRACT(EPOCH FROM (a.end_time - a.start_time)) / 3600)
            FROM activities a
            WHERE a.doctor_id = p_doctor_id
              AND DATE(a.start_time) = p_date
              AND NOT EXISTS (SELECT 1 FROM leave lv WHERE lv.activity_id = a.id)
        ), 0)
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
GRANT EXECUTE ON FUNCTION get_doctor_schedule(UUID, DATE) TO authenticated;
