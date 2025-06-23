-- Get Doctor Weekly Rooms Stored Procedure
-- Admin Query #2: Get doctor's room assignments for a week

CREATE OR REPLACE FUNCTION get_doctor_weekly_rooms(
    p_doctor_id UUID,
    p_week_start DATE
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_doctor_name TEXT;
    v_week_end DATE;
    v_weekly_data JSON[];
    v_day_data JSON;
    v_current_date DATE;
    v_day_activities JSON[];
    v_leave_exists BOOLEAN;
BEGIN
    -- Validate input parameters
    IF p_doctor_id IS NULL OR p_week_start IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Doctor ID and week start date are required',
            'error_code', 'MISSING_PARAMETERS'
        );
    END IF;

    -- Calculate week end (6 days after start, making it a 7-day week)
    v_week_end := p_week_start + INTERVAL '6 days';

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

    -- Initialize current date to week start
    v_current_date := p_week_start;

    -- Loop through each day of the week
    WHILE v_current_date <= v_week_end LOOP
        
        -- Check if doctor has leave for this day
        SELECT EXISTS(
            SELECT 1 
            FROM activities a
            JOIN leave l ON a.id = l.activity_id
            WHERE a.doctor_id = p_doctor_id
              AND DATE(a.start_time) = v_current_date
        ) INTO v_leave_exists;

        -- If doctor is on leave for this day
        IF v_leave_exists THEN
            v_day_data := json_build_object(
                'date', v_current_date,
                'day_of_week', EXTRACT(DOW FROM v_current_date),
                'day_name', TO_CHAR(v_current_date, 'Day'),
                'status', 'LEAVE',
                'rooms', '[]'::json,
                'total_hours', 0
            );
        ELSE
            -- Get room assignments for this day
            SELECT array_agg(
                json_build_object(
                    'activity_id', a.id,
                    'room_id', r.id,
                    'room_name', r.room_name,
                    'location_name', l.location_name,
                    'location_key', l.location_key,
                    'start_time', a.start_time,
                    'end_time', a.end_time,
                    'duration_hours', EXTRACT(EPOCH FROM (a.end_time - a.start_time)) / 3600
                ) ORDER BY a.start_time
            ) INTO v_day_activities
            FROM activities a
            JOIN rooms r ON a.room_id = r.id
            JOIN locations l ON r.location_id = l.id
            WHERE a.doctor_id = p_doctor_id
              AND DATE(a.start_time) = v_current_date
              AND NOT EXISTS (
                  SELECT 1 FROM leave lv WHERE lv.activity_id = a.id
              );

            v_day_data := json_build_object(
                'date', v_current_date,
                'day_of_week', EXTRACT(DOW FROM v_current_date),
                'day_name', TO_CHAR(v_current_date, 'Day'),
                'status', CASE 
                    WHEN v_day_activities IS NULL OR array_length(v_day_activities, 1) = 0 THEN 'NO_ACTIVITIES'
                    ELSE 'SCHEDULED'
                END,
                'rooms', COALESCE(array_to_json(v_day_activities), '[]'::json),
                'total_hours', COALESCE((
                    SELECT SUM(EXTRACT(EPOCH FROM (a.end_time - a.start_time)) / 3600)
                    FROM activities a
                    WHERE a.doctor_id = p_doctor_id
                      AND DATE(a.start_time) = v_current_date
                      AND NOT EXISTS (SELECT 1 FROM leave lv WHERE lv.activity_id = a.id)
                ), 0)
            );
        END IF;

        -- Add day data to weekly array
        v_weekly_data := v_weekly_data || v_day_data;
        
        -- Move to next day
        v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;

    -- Build the response
    RETURN json_build_object(
        'success', true,
        'doctor_id', p_doctor_id,
        'doctor_name', v_doctor_name,
        'week_start', p_week_start,
        'week_end', v_week_end,
        'weekly_schedule', array_to_json(v_weekly_data),
        'total_week_hours', (
            SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (a.end_time - a.start_time)) / 3600), 0)
            FROM activities a
            WHERE a.doctor_id = p_doctor_id
              AND DATE(a.start_time) BETWEEN p_week_start AND v_week_end
              AND NOT EXISTS (SELECT 1 FROM leave lv WHERE lv.activity_id = a.id)
        ),
        'days_on_leave', (
            SELECT COUNT(DISTINCT DATE(a.start_time))
            FROM activities a
            JOIN leave l ON a.id = l.activity_id
            WHERE a.doctor_id = p_doctor_id
              AND DATE(a.start_time) BETWEEN p_week_start AND v_week_end
        ),
        'days_with_activities', (
            SELECT COUNT(DISTINCT DATE(a.start_time))
            FROM activities a
            WHERE a.doctor_id = p_doctor_id
              AND DATE(a.start_time) BETWEEN p_week_start AND v_week_end
              AND NOT EXISTS (SELECT 1 FROM leave lv WHERE lv.activity_id = a.id)
        )
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
GRANT EXECUTE ON FUNCTION get_doctor_weekly_rooms(UUID, DATE) TO authenticated;
