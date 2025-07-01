import { dbAll } from '../../../utils/database';
import { ActivityResponse } from '../types/ActivityResponse';
import { ActivityFilter } from '../types/ActivityFilter';
import { Activity } from '../types/Activity';

export const getActivities = async (filters?: ActivityFilter): Promise<ActivityResponse> => {
  const response: ActivityResponse = {
    success: false,
    message: '',
    errors: []
  };

  try {
    // Build WHERE clause and parameters based on filters
    const whereConditions: string[] = [];
    const queryParams: any[] = [];

    if (filters?.doctor_id) {
      whereConditions.push('a.doctor_id = ?');
      queryParams.push(filters.doctor_id);
    }

    if (filters?.room_id) {
      whereConditions.push('a.room_id = ?');
      queryParams.push(filters.room_id);
    }

    if (filters?.activity_type) {
      whereConditions.push('a.activity_type = ?');
      queryParams.push(filters.activity_type);
    }

    if (filters?.is_template_generated !== undefined) {
      whereConditions.push('a.is_template_generated = ?');
      queryParams.push(filters.is_template_generated);
    }

    if (filters?.generation_month) {
      whereConditions.push('a.generation_month = ?');
      queryParams.push(filters.generation_month);
    }

    // Handle date range filtering
    if (filters?.start_date) {
      // Convert YYYY-MM-DD to start of day timestamp
      const startDate = new Date(filters.start_date + 'T00:00:00.000Z');
      const startTimestamp = Math.floor(startDate.getTime() / 1000);
      whereConditions.push('a.start_time >= ?');
      queryParams.push(startTimestamp);
    }

    if (filters?.end_date) {
      // Convert YYYY-MM-DD to end of day timestamp
      const endDate = new Date(filters.end_date + 'T23:59:59.999Z');
      const endTimestamp = Math.floor(endDate.getTime() / 1000);
      whereConditions.push('a.end_time <= ?');
      queryParams.push(endTimestamp);
    }

    // Build the final query
    let whereClause = '';
    if (whereConditions.length > 0) {
      whereClause = 'WHERE ' + whereConditions.join(' AND ');
    }

    // Retrieve activities with related information
    const activities = await dbAll(
      `SELECT 
        a.*, 
        d.first_name || ' ' || d.last_name as doctor_name,
        r.room_name,
        l.location_name,
        CASE 
          WHEN a.template_id IS NOT NULL THEN t.template_name
          ELSE NULL
        END as template_name
       FROM activities a
       JOIN doctors d ON a.doctor_id = d.id
       JOIN rooms r ON a.room_id = r.id
       JOIN locations l ON r.location_id = l.id
       LEFT JOIN activity_templates t ON a.template_id = t.id
       ${whereClause}
       ORDER BY a.start_time DESC`,
      queryParams
    ) as Activity[];

    response.success = true;
    response.message = `Retrieved ${activities.length} activities`;
    response.activities = activities;

    return response;
  } catch (error) {
    response.errors?.push(`Failed to retrieve activities: ${error}`);
    response.message = `Database error: ${error}`;
    console.error('Error retrieving activities:', error);
    return response;
  }
};
