-- Get Room Activities Stored Procedure
-- Admin Query #3: Get activities for a specific room on a date, showing coverage needs

CREATE OR REPLACE FUNCTION get_room_activities(
    p_room_id UUID,
    p_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_room_name TEXT;
    v_location_name TEXT;
    v_activities JSON[];
    v_activity RECORD;
    v_requiring_cover_count INTEGER := 0;
    v_total_activities INTEGER := 0;
BEGIN
    -- Validate input parameters
    IF p_room_id IS NULL OR p_date IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Room ID and date are required',
            'error_code', 'MISSING_PARAMETERS'
        );
    END IF;

    -- Check if room exists and get room/location details
    SELECT r.room_name, l.location_name 
    INTO v_room_name, v_location_name
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

    -- Get all activities for the room on the specified date
    SELECT array_agg(
        json_build_object(
            'activity_id', a.id,
            'start_time', a.start_time,
            'end_time', a.end_time,
            'duration_hours', EXTRACT(EPOCH FROM (a.end_time - a.start_time)) / 3600,
            'doctor_id', d.id,
            'doctor_name', CONCAT(d.first_name, ' ', d.last_name),
            'status', CASE 
                WHEN lv.id IS NOT NULL THEN 'REQUIRING COVER'
                ELSE 'SCHEDULED'
            END,
            'is_leave', CASE WHEN lv.id IS NOT NULL THEN true ELSE false END,
            'covering_doctor_id', lv.dr_covering_inbox,
            'covering_doctor_name', CASE 
                WHEN lv.dr_covering_inbox IS NOT NULL THEN 
                    CONCAT(covering_dr.first_name, ' ', covering_dr.last_name)
                ELSE NULL
            END,
            'leave_id', lv.id
        ) ORDER BY a.start_time
    ) INTO v_activities
    FROM activities a
    JOIN doctors d ON a.doctor_id = d.id
    LEFT JOIN leave lv ON a.id = lv.activity_id
    LEFT JOIN doctors covering_dr ON lv.dr_covering_inbox = covering_dr.id
    WHERE a.room_id = p_room_id
      AND DATE(a.start_time) = p_date;

    -- Count activities requiring cover and total activities
    SELECT 
        COUNT(*) FILTER (WHERE lv.id IS NOT NULL),
        COUNT(*)
    INTO v_requiring_cover_count, v_total_activities
    FROM activities a
    LEFT JOIN leave lv ON a.id = lv.activity_id
    WHERE a.room_id = p_room_id
      AND DATE(a.start_time) = p_date;

    -- Build the response
    RETURN json_build_object(
        'success', true,
        'room_id', p_room_id,
        'room_name', v_room_name,
        'location_name', v_location_name,
        'date', p_date,
        'activities', COALESCE(array_to_json(v_activities), '[]'::json),
        'summary', json_build_object(
            'total_activities', v_total_activities,
            'requiring_cover', v_requiring_cover_count,
            'scheduled_activities', v_total_activities - v_requiring_cover_count,
            'total_hours_booked', COALESCE((
                SELECT SUM(EXTRACT(EPOCH FROM (a.end_time - a.start_time)) / 3600)
                FROM activities a
                WHERE a.room_id = p_room_id
                  AND DATE(a.start_time) = p_date
            ), 0),
            'hours_requiring_cover', COALESCE((
                SELECT SUM(EXTRACT(EPOCH FROM (a.end_time - a.start_time)) / 3600)
                FROM activities a
                JOIN leave lv ON a.id = lv.activity_id
                WHERE a.room_id = p_room_id
                  AND DATE(a.start_time) = p_date
            ), 0)
        ),
        'coverage_status', CASE 
            WHEN v_requiring_cover_count = 0 THEN 'FULLY_COVERED'
            WHEN v_requiring_cover_count = v_total_activities THEN 'ALL_REQUIRING_COVER'
            ELSE 'PARTIAL_COVER_NEEDED'
        END,
        'inbox_coverage_needed', CASE 
            WHEN v_requiring_cover_count > 0 THEN true 
            ELSE false 
        END
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

-- Additional helper function to get all rooms requiring coverage for a date
CREATE OR REPLACE FUNCTION get_rooms_requiring_cover(
    p_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_rooms_needing_cover JSON[];
BEGIN
    -- Validate input parameter
    IF p_date IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Date is required',
            'error_code', 'MISSING_PARAMETERS'
        );
    END IF;

    -- Get all rooms that have activities requiring cover on the specified date
    SELECT array_agg(
        json_build_object(
            'room_id', r.id,
            'room_name', r.room_name,
            'location_name', l.location_name,
            'activities_needing_cover', COUNT(a.id),
            'total_hours_needing_cover', SUM(EXTRACT(EPOCH FROM (a.end_time - a.start_time)) / 3600)
        )
    ) INTO v_rooms_needing_cover
    FROM rooms r
    JOIN locations l ON r.location_id = l.id
    JOIN activities a ON r.id = a.room_id
    JOIN leave lv ON a.id = lv.activity_id
    WHERE DATE(a.start_time) = p_date
    GROUP BY r.id, r.room_name, l.location_name
    ORDER BY r.room_name;

    RETURN json_build_object(
        'success', true,
        'date', p_date,
        'rooms_requiring_cover', COALESCE(array_to_json(v_rooms_needing_cover), '[]'::json),
        'total_rooms_affected', COALESCE(array_length(v_rooms_needing_cover, 1), 0)
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
GRANT EXECUTE ON FUNCTION get_room_activities(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_rooms_requiring_cover(DATE) TO authenticated;
