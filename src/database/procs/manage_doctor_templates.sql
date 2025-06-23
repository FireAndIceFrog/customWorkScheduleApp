-- Doctor Template Management Stored Procedures
-- Functions to view, update, and manage doctor activity templates

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_doctor_templates(UUID);
DROP FUNCTION IF EXISTS update_activity_template(UUID, UUID, INTEGER, TIME, TIME, VARCHAR, BOOLEAN);
DROP FUNCTION IF EXISTS deactivate_activity_template(UUID, BOOLEAN);

-- Get all templates for a doctor
CREATE OR REPLACE FUNCTION get_doctor_templates(
    p_doctor_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_doctor_name TEXT;
    v_templates JSON[];
BEGIN
    -- Validate input parameter
    IF p_doctor_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Doctor ID is required',
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

    -- Get all templates for the doctor
    SELECT array_agg(
        json_build_object(
            'template_id', t.id,
            'template_name', t.template_name,
            'day_of_week', t.day_of_week,
            'day_name', CASE t.day_of_week
                WHEN 0 THEN 'Sunday'
                WHEN 1 THEN 'Monday'
                WHEN 2 THEN 'Tuesday'
                WHEN 3 THEN 'Wednesday'
                WHEN 4 THEN 'Thursday'
                WHEN 5 THEN 'Friday'
                WHEN 6 THEN 'Saturday'
            END,
            'start_time', t.start_time,
            'end_time', t.end_time,
            'room_id', r.id,
            'room_name', r.room_name,
            'location_name', l.location_name,
            'location_key', l.location_key,
            'is_active', t.is_active,
            'created_at', t.created_at,
            'updated_at', t.updated_at
        ) ORDER BY t.day_of_week, t.start_time
    ) INTO v_templates
    FROM activity_templates t
    JOIN rooms r ON t.room_id = r.id
    JOIN locations l ON r.location_id = l.id
    WHERE t.doctor_id = p_doctor_id;

    RETURN json_build_object(
        'success', true,
        'doctor_id', p_doctor_id,
        'doctor_name', v_doctor_name,
        'templates', COALESCE(array_to_json(v_templates), '[]'::json),
        'total_templates', COALESCE(array_length(v_templates, 1), 0),
        'active_templates', (
            SELECT COUNT(*) 
            FROM activity_templates 
            WHERE doctor_id = p_doctor_id AND is_active = true
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

-- Update an activity template
CREATE OR REPLACE FUNCTION update_activity_template(
    p_template_id UUID,
    p_room_id UUID DEFAULT NULL,
    p_day_of_week INTEGER DEFAULT NULL,
    p_start_time TIME DEFAULT NULL,
    p_end_time TIME DEFAULT NULL,
    p_template_name VARCHAR DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_template RECORD;
    v_doctor_name TEXT;
    v_room_name TEXT;
    v_location_name TEXT;
    v_conflict_count INTEGER;
BEGIN
    -- Validate input parameter
    IF p_template_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Template ID is required',
            'error_code', 'MISSING_PARAMETERS'
        );
    END IF;

    -- Get current template details
    SELECT 
        t.*,
        d.first_name || ' ' || d.last_name as doctor_name,
        r.room_name,
        l.location_name
    INTO v_template
    FROM activity_templates t
    JOIN doctors d ON t.doctor_id = d.id
    JOIN rooms r ON t.room_id = r.id
    JOIN locations l ON r.location_id = l.id
    WHERE t.id = p_template_id;

    IF v_template.id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Template not found',
            'error_code', 'TEMPLATE_NOT_FOUND'
        );
    END IF;

    -- Use existing values if not provided
    p_room_id := COALESCE(p_room_id, v_template.room_id);
    p_day_of_week := COALESCE(p_day_of_week, v_template.day_of_week);
    p_start_time := COALESCE(p_start_time, v_template.start_time);
    p_end_time := COALESCE(p_end_time, v_template.end_time);
    p_template_name := COALESCE(p_template_name, v_template.template_name);
    p_is_active := COALESCE(p_is_active, v_template.is_active);

    -- Validate day of week if provided
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

    -- Check if room exists if different from current
    IF p_room_id != v_template.room_id THEN
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
    ELSE
        v_room_name := v_template.room_name;
        v_location_name := v_template.location_name;
    END IF;

    -- Check for conflicts if template is being activated or key fields are changing
    IF p_is_active AND (
        p_room_id != v_template.room_id OR 
        p_day_of_week != v_template.day_of_week OR 
        p_start_time != v_template.start_time OR 
        p_end_time != v_template.end_time OR
        NOT v_template.is_active
    ) THEN
        -- Check for doctor template conflicts
        SELECT COUNT(*) INTO v_conflict_count
        FROM activity_templates
        WHERE doctor_id = v_template.doctor_id
          AND day_of_week = p_day_of_week
          AND is_active = true
          AND id != p_template_id
          AND (start_time < p_end_time AND end_time > p_start_time);

        IF v_conflict_count > 0 THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Doctor already has an active template for this day with overlapping times',
                'error_code', 'TEMPLATE_CONFLICT'
            );
        END IF;

        -- Check for room template conflicts
        SELECT COUNT(*) INTO v_conflict_count
        FROM activity_templates
        WHERE room_id = p_room_id
          AND day_of_week = p_day_of_week
          AND is_active = true
          AND id != p_template_id
          AND (start_time < p_end_time AND end_time > p_start_time);

        IF v_conflict_count > 0 THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Room already has an active template for this day with overlapping times',
                'error_code', 'ROOM_TEMPLATE_CONFLICT'
            );
        END IF;
    END IF;

    -- Update the template
    UPDATE activity_templates 
    SET 
        room_id = p_room_id,
        day_of_week = p_day_of_week,
        start_time = p_start_time,
        end_time = p_end_time,
        template_name = p_template_name,
        is_active = p_is_active
    WHERE id = p_template_id;

    -- Return success response
    RETURN json_build_object(
        'success', true,
        'template_id', p_template_id,
        'doctor_name', v_template.doctor_name,
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
        'is_active', p_is_active,
        'message', 'Template updated successfully'
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

-- Deactivate/Delete a template
CREATE OR REPLACE FUNCTION deactivate_activity_template(
    p_template_id UUID,
    p_permanent_delete BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_template RECORD;
    v_generated_activities_count INTEGER;
BEGIN
    -- Validate input parameter
    IF p_template_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Template ID is required',
            'error_code', 'MISSING_PARAMETERS'
        );
    END IF;

    -- Get template details
    SELECT 
        t.*,
        d.first_name || ' ' || d.last_name as doctor_name
    INTO v_template
    FROM activity_templates t
    JOIN doctors d ON t.doctor_id = d.id
    WHERE t.id = p_template_id;

    IF v_template.id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Template not found',
            'error_code', 'TEMPLATE_NOT_FOUND'
        );
    END IF;

    -- Count generated activities from this template
    SELECT COUNT(*) INTO v_generated_activities_count
    FROM activities
    WHERE template_id = p_template_id;

    IF p_permanent_delete THEN
        -- Delete the template permanently
        DELETE FROM activity_templates WHERE id = p_template_id;
        
        RETURN json_build_object(
            'success', true,
            'template_id', p_template_id,
            'doctor_name', v_template.doctor_name,
            'action', 'deleted',
            'generated_activities_affected', v_generated_activities_count,
            'message', 'Template deleted permanently'
        );
    ELSE
        -- Just deactivate the template
        UPDATE activity_templates 
        SET is_active = false
        WHERE id = p_template_id;
        
        RETURN json_build_object(
            'success', true,
            'template_id', p_template_id,
            'doctor_name', v_template.doctor_name,
            'action', 'deactivated',
            'generated_activities_count', v_generated_activities_count,
            'message', 'Template deactivated successfully'
        );
    END IF;

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
GRANT EXECUTE ON FUNCTION get_doctor_templates(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_activity_template(UUID, UUID, INTEGER, TIME, TIME, VARCHAR, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION deactivate_activity_template(UUID, BOOLEAN) TO authenticated;
