import { uuidv7 } from 'uuidv7';
import { dbRun, dbGet, dbAll } from '../../../utils/database';
import { GenerationResult } from '../types/GenerationResult';
import { ActivityTemplate } from '../types/ActivityTemplate';
import { createActivity } from '../../activities/services/createActivity';

export const generateActivitiesFromTemplates = async (month: string): Promise<GenerationResult> => {
  const result: GenerationResult = {
    success: false,
    message: '',
    generation_month: month,
    total_templates_processed: 0,
    total_activities_generated: 0,
    total_conflicts_skipped: 0,
    errors: [],
    activities_generated: [],
    conflicts: []
  };

  try {
    // Validate month format (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      result.errors?.push('Month must be in YYYY-MM format');
      result.message = 'Validation failed';
      return result;
    }

    // Parse month to get year and month
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1); // First day of month
    const endDate = new Date(year, monthNum, 0); // Last day of month

    // Check if generation already exists for this month
    const existingGeneration = await dbGet(
      'SELECT id FROM generation_logs WHERE generation_month = ?',
      [month]
    );

    if (existingGeneration) {
      result.errors?.push('Generation already completed for this month');
      result.message = 'Activities have already been generated for this month';
      return result;
    }

    // Get all active templates
    const activeTemplates = await dbAll(
      `SELECT 
        t.*, 
        d.first_name || ' ' || d.last_name as doctor_name,
        r.room_name,
        l.location_name
       FROM activity_templates t
       JOIN doctors d ON t.doctor_id = d.id
       JOIN rooms r ON t.room_id = r.id
       JOIN locations l ON r.location_id = l.id
       WHERE t.is_active = 1
       ORDER BY t.doctor_id, t.day_of_week, t.start_time`
    ) as any[];

    result.total_templates_processed = activeTemplates.length;

    // Generate activities for each template
    for (const template of activeTemplates) {
      // Find all matching days in the month
      const matchingDays = [];
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        if (date.getDay() === template.day_of_week) {
          matchingDays.push(new Date(date));
        }
      }

      // Generate activities for each matching day
      for (const activityDate of matchingDays) {
        // Convert HH:MM to full datetime timestamps
        const [startHour, startMin] = template.start_time.split(':').map(Number);
        const [endHour, endMin] = template.end_time.split(':').map(Number);
        
        const startDateTime = new Date(activityDate);
        startDateTime.setHours(startHour, startMin, 0, 0);
        
        const endDateTime = new Date(activityDate);
        endDateTime.setHours(endHour, endMin, 0, 0);

        const startTimestamp = Math.floor(startDateTime.getTime() / 1000);
        const endTimestamp = Math.floor(endDateTime.getTime() / 1000);

        // Check for room conflicts
        const roomConflict = await dbGet(
          'SELECT id FROM activities WHERE room_id = ? AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?) OR (start_time >= ? AND end_time <= ?))',
          [template.room_id, startTimestamp, startTimestamp, endTimestamp, endTimestamp, startTimestamp, endTimestamp]
        );

        if (roomConflict) {
          result.total_conflicts_skipped++;
          result.conflicts?.push({
            template_id: template.id,
            doctor_name: (template as any).doctor_name,
            room_name: (template as any).room_name,
            date: activityDate.toISOString().split('T')[0],
            time: `${template.start_time}-${template.end_time}`,
            reason: 'Room conflict with existing activity'
          });
          continue;
        }

        const {activity} = await createActivity({
          start_time: startTimestamp, // Unix timestamp
          end_time: endTimestamp, // Unix timestamp
          doctor_id: template.doctor_id,
          room_id: template.room_id,
          activity_type: 'BOOKING', // defaults to 'BOOKING'
          template_id:template.id,
          generation_month:month,
        })

        if(!activity) {
          result.errors?.push(`Failed to create activity for template ${template.id} on ${activityDate.toISOString()}`);
          continue;
        }

        result.total_activities_generated++;
        result.activities_generated?.push({
          id: activity.id,
          template_id: template.id,
          doctor_name: (template as any).doctor_name,
          room_name: (template as any).room_name,
          location_name: (template as any).location_name,
          date: activityDate.toISOString().split('T')[0],
          start_time: template.start_time,
          end_time: template.end_time
        });
      }
    }

    // Log the generation process
    const logId = uuidv7();
    await dbRun(
      `INSERT INTO generation_logs (id, generation_month, total_templates_processed, total_activities_generated, total_conflicts_skipped, generation_status, generated_at, generated_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        logId,
        month,
        result.total_templates_processed,
        result.total_activities_generated,
        result.total_conflicts_skipped,
        'COMPLETED',
        Math.floor(Date.now() / 1000),
        'SYSTEM'
      ]
    );

    result.success = true;
    result.message = `Generation completed successfully. Generated ${result.total_activities_generated} activities from ${result.total_templates_processed} templates. ${result.total_conflicts_skipped} conflicts skipped.`;

    return result;
  } catch (error) {
    result.errors?.push(`Failed to generate activities: ${error}`);
    result.message = `Generation failed: ${error}`;
    console.error('Error generating activities from templates:', error);

    // Log the failed generation
    try {
      const logId = uuidv7();
      await dbRun(
        `INSERT INTO generation_logs (id, generation_month, total_templates_processed, total_activities_generated, total_conflicts_skipped, generation_status, error_message, generated_at, generated_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          logId,
          month,
          result.total_templates_processed,
          result.total_activities_generated,
          result.total_conflicts_skipped,
          'FAILED',
          String(error),
          Math.floor(Date.now() / 1000),
          'SYSTEM'
        ]
      );
    } catch (logError) {
      console.error('Error logging failed generation:', logError);
    }

    return result;
  }
};
