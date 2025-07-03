import { dbRun } from '../../../utils/database';
import { ActivityFilter } from '../types/ActivityFilter';
import { ActivityResponse } from '../types/ActivityResponse';

/**
 * Delete activities based on filter criteria.
 * @param filter ActivityFilter object specifying which activities to delete
 * @returns ActivityResponse with success, message, and deleted count
 */
export const deleteActivities = async (
  filter: ActivityFilter
): Promise<ActivityResponse> => {
  const response: ActivityResponse = {
    success: false,
    message: '',
    errors: [],
  };

  try {
    // Build WHERE clause dynamically from filter
    const whereClauses: string[] = [];
    const params: any[] = [];
    if (filter.id) {
      whereClauses.push('id = ?');
      params.push(filter.id);
    }
    if (filter.doctor_id) {
      whereClauses.push('doctor_id = ?');
      params.push(filter.doctor_id);
    }
    if (filter.room_id) {
      whereClauses.push('room_id = ?');
      params.push(filter.room_id);
    }
    if (filter.start_date) {
      whereClauses.push('DATE(start_time) = ?');
      params.push(filter.start_date);
    }
    if (filter.end_date) {
      whereClauses.push('DATE(end_time) = ?');
      params.push(filter.end_date);
    }
    if (filter.activity_type) {
      whereClauses.push('activity_type = ?');
      params.push(filter.activity_type);
    }
    if (typeof filter.is_template_generated === 'number') {
      whereClauses.push('is_template_generated = ?');
      params.push(filter.is_template_generated);
    }
    if (filter.generation_month) {
      whereClauses.push('generation_month = ?');
      params.push(filter.generation_month);
    }

    if (whereClauses.length === 0) {
      response.message = 'No filter provided. Refusing to delete all activities.';
      response.errors?.push('At least one filter field is required.');
      return response;
    }

    const whereSQL = whereClauses.join(' AND ');
    const sql = `DELETE FROM activities WHERE ${whereSQL}`;
    const result = await dbRun(sql, params);

    response.success = true;
    response.message = `Deleted ${result.changes || 0} activities.`;
    (response as any).deletedCount = result.changes || 0;
    return response;
  } catch (error) {
    response.errors?.push(`Failed to delete activities: ${error}`);
    response.message = `Database error: ${error}`;
    console.error('Error deleting activities:', error);
    return response;
  }
};
