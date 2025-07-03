import { uuidv7 } from 'uuidv7';
import { dbRun, dbGet } from '../../../utils/database';
import { CreateActivityRequest } from '../types/CreateActivityRequest';
import { ActivityResponse } from '../types/ActivityResponse';
import { Activity } from '../types/Activity';
import { getActivities } from './getActivities';

export const createActivity = async (
  activityData: CreateActivityRequest
): Promise<ActivityResponse> => {
  const response: ActivityResponse = {
    success: false,
    message: '',
    errors: [],
  };

  try {
    // Validate input
    if (
      !activityData.doctor_id ||
      !activityData.room_id ||
      !activityData.start_time ||
      !activityData.end_time
    ) {
      response.errors?.push(
        'Doctor ID, room ID, start time, and end time are required'
      );
      response.message = 'Validation failed';
      return response;
    }

    // Validate start time before end time
    if (activityData.start_time >= activityData.end_time) {
      response.errors?.push('Start time must be before end time');
      response.message = 'Validation failed';
      return response;
    }

    // Check if doctor exists
    const doctorExists = await dbGet('SELECT id FROM doctors WHERE id = ?', [
      activityData.doctor_id,
    ]);

    if (!doctorExists) {
      response.errors?.push('Doctor not found');
      response.message = 'Specified doctor does not exist';
      return response;
    }

    // Check if room exists
    const roomExists = await dbGet('SELECT id FROM rooms WHERE id = ?', [
      activityData.room_id,
    ]);

    if (!roomExists) {
      response.errors?.push('Room not found');
      response.message = 'Specified room does not exist';
      return response;
    }

    // Check for room conflicts
    const roomConflict = await dbGet(
      'SELECT id FROM activities WHERE room_id = ? AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?) OR (start_time >= ? AND end_time <= ?))',
      [
        activityData.room_id,
        activityData.start_time,
        activityData.start_time,
        activityData.end_time,
        activityData.end_time,
        activityData.start_time,
        activityData.end_time,
      ]
    );

    if (roomConflict) {
      response.errors?.push('Room conflict with existing activity');
      response.message = 'The room is already booked for this time period';
      return response;
    }

    // Generate UUID and timestamp
    const activityId = uuidv7();
    const currentTime = Math.floor(Date.now() / 1000);

    // Insert activity into database
    await dbRun(
      `INSERT INTO activities (id, start_time, end_time, doctor_id, room_id, activity_type, notes, template_id, generation_month, is_template_generated, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        activityId,
        activityData.start_time,
        activityData.end_time,
        activityData.doctor_id,
        activityData.room_id,
        activityData.activity_type || 'BOOKING',
        activityData.notes || null,
        activityData.template_id || null,
        activityData.generation_month || null,
        activityData.template_id ? 1 : 0,
        currentTime,
        currentTime,
      ]
    );

    const createdActivity = await getActivities({
      id: activityId,
    });

    response.success = true;
    response.message = 'Activity created successfully';
    response.activity = createdActivity.activities?.[0] || undefined;

    return response;
  } catch (error) {
    response.errors?.push(`Failed to create activity: ${error}`);
    response.message = `Database error: ${error}`;
    console.error('Error creating activity:', error);
    return response;
  }
};
