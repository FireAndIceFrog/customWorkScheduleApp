-- Generate Monthly Activities Stored Procedure
-- Automatically generates concrete activities from templates for a given month

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS generate_monthly_activities(DATE);
DROP FUNCTION IF EXISTS get_generation_status(DATE);

CREATE OR REPLACE FUNCTION generate_monthly_activities(
    p_target_month DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_month_start DATE;
    v_month_end DATE;
    v_current_date DATE;
    v_template RECORD;
    v_activity_id UUID;
    v_total_templates INTEGER := 0;
    v_total_generated INTEGER := 0;
    v_total_conflicts INTEGER := 0;
    v_log_id UUID;
    v_conflict_exists BOOLEAN;
    v_activity_start TIMESTAMPTZ;
    v_activity_end TIMESTAMPTZ;
BEGIN
    -- Normalize target month to first day of month
    v_month_start := DATE_TRUNC('month', p_target_month);
    v_month_end := v_month_start + INTERVAL '1 month' - INTERVAL '1 day';

    -- Check if generation has already been run for this month
    IF EXISTS (
        SELECT 1 FROM generation_logs 
        WHERE generation_month = v_month_start
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Monthly activities have already been generated for ' || v_month_start::TEXT,
            'error_code', 'ALREADY_GENERATED',
            'generation_month', v_month_start
        );
    END IF;

    -- Create generation log entry
    INSERT INTO generation_logs (generation_month)
    VALUES (v_month_start)
    RETURNING id INTO v_log_id;

    -- Loop through all active templates
    FOR v_template IN (
        SELECT 
            t.*,
            d.first_name || ' ' || d.last_name as doctor_name,
            r.room_name,
            l.location_name
        FROM activity_templates t
        JOIN doctors d ON t.doctor_id = d.id
        JOIN rooms r ON t.room_id = r.id
        JOIN locations l ON r.location_id = l.id
        WHERE t.is_active = true
        ORDER BY t.doctor_id, t.day_of_week, t.start_time
    ) LOOP
        v_total_templates := v_total_templates + 1;
        
        -- Find all dates in the month that match this template's day of week
        v_current_date := v_month_start;
        
        WHILE v_current_date <= v_month_end LOOP
            -- Check if this date matches the template's day of week
            IF EXTRACT(DOW FROM v_current_date) = v_template.day_of_week THEN
                
                -- Calculate full timestamp for the activity
                v_activity_start := v_current_date + v_template.start_time;
                v_activity_end := v_current_date + v_template.end_time;
                
                -- Check for conflicts with existing activities
                SELECT EXISTS (
                    SELECT 1 FROM activities a
                    WHERE a.room_id = v_template.room_id
                      AND a.start_time < v_activity_end
                      AND a.end_time > v_activity_start
                ) INTO v_conflict_exists;
                
                -- If no conflict, create the activity
                IF NOT v_conflict_exists THEN
                    INSERT INTO activities (
                        doctor_id,
                        room_id,
                        start_time,
                        end_time,
                        template_id,
                        generation_month,
                        is_template_generated
                    ) VALUES (
                        v_template.doctor_id,
                        v_template.room_id,
                        v_activity_start,
                        v_activity_end,
                        v_template.id,
                        v_month_start,
                        true
                    );
                    
                    v_total_generated := v_total_generated + 1;
                ELSE
                    -- Conflict detected, skip this occurrence
                    v_total_conflicts := v_total_conflicts + 1;
                END IF;
                
            END IF;
            
            -- Move to next day
            v_current_date := v_current_date + INTERVAL '1 day';
        END LOOP;
    END LOOP;

    -- Update generation log with results
    UPDATE generation_logs 
    SET 
        total_templates_processed = v_total_templates,
        total_activities_generated = v_total_generated,
        total_conflicts_skipped = v_total_conflicts
    WHERE id = v_log_id;

    -- Return success response with summary
    RETURN json_build_object(
        'success', true,
        'generation_month', v_month_start,
        'month_name', TO_CHAR(v_month_start, 'Month YYYY'),
        'summary', json_build_object(
            'total_templates_processed', v_total_templates,
            'total_activities_generated', v_total_generated,
            'total_conflicts_skipped', v_total_conflicts,
            'success_rate', CASE 
                WHEN v_total_templates > 0 THEN 
                    ROUND((v_total_generated::DECIMAL / (v_total_generated + v_total_conflicts)) * 100, 2)
                ELSE 0 
            END
        ),
        'log_id', v_log_id,
        'message', 'Monthly activities generated successfully'
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Clean up on error - remove any partially generated activities
        DELETE FROM activities 
        WHERE generation_month = v_month_start 
          AND is_template_generated = true;
        
        -- Update log with error
        UPDATE generation_logs 
        SET 
            total_templates_processed = v_total_templates,
            total_activities_generated = 0,
            total_conflicts_skipped = v_total_conflicts
        WHERE id = v_log_id;
        
        RETURN json_build_object(
            'success', false,
            'error', 'Database error during generation: ' || SQLERRM,
            'error_code', 'GENERATION_ERROR',
            'generation_month', v_month_start,
            'partial_results', json_build_object(
                'templates_processed', v_total_templates,
                'conflicts_detected', v_total_conflicts
            )
        );
END;
$$;

-- Helper function to get generation status for a month
CREATE OR REPLACE FUNCTION get_generation_status(
    p_target_month DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_month_start DATE;
    v_log_record RECORD;
    v_active_templates INTEGER;
BEGIN
    v_month_start := DATE_TRUNC('month', p_target_month);
    
    -- Get generation log for this month
    SELECT * INTO v_log_record
    FROM generation_logs
    WHERE generation_month = v_month_start;
    
    -- Count current active templates
    SELECT COUNT(*) INTO v_active_templates
    FROM activity_templates
    WHERE is_active = true;
    
    IF v_log_record.id IS NOT NULL THEN
        RETURN json_build_object(
            'success', true,
            'generation_month', v_month_start,
            'month_name', TO_CHAR(v_month_start, 'Month YYYY'),
            'is_generated', true,
            'generated_at', v_log_record.generated_at,
            'summary', json_build_object(
                'total_templates_processed', v_log_record.total_templates_processed,
                'total_activities_generated', v_log_record.total_activities_generated,
                'total_conflicts_skipped', v_log_record.total_conflicts_skipped
            ),
            'current_active_templates', v_active_templates
        );
    ELSE
        RETURN json_build_object(
            'success', true,
            'generation_month', v_month_start,
            'month_name', TO_CHAR(v_month_start, 'Month YYYY'),
            'is_generated', false,
            'current_active_templates', v_active_templates,
            'message', 'No generation has been run for this month'
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
GRANT EXECUTE ON FUNCTION generate_monthly_activities(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_generation_status(DATE) TO authenticated;
