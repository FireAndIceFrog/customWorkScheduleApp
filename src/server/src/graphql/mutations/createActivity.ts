import { uuidv7 } from 'uuidv7';
import { dbRun, dbGet } from '../utils/database';
import { transformActivity, isoToTimestamp } from '../utils/transforms';

export const createActivity = async (_: any, { input }: { input: any }) => {
  const id = uuidv7();
  const now = Math.floor(Date.now() / 1000);
  const startTime = isoToTimestamp(input.startTime);
  const endTime = isoToTimestamp(input.endTime);
  
  await dbRun(
    'INSERT INTO activities (id, start_time, end_time, doctor_id, room_id, activity_type, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, startTime, endTime, input.doctorId, input.roomId, input.activityType || 'BOOKING', input.notes, now, now]
  );
  
  const activity = await dbGet('SELECT * FROM activities WHERE id = ?', [id]);
  return transformActivity(activity);
};
