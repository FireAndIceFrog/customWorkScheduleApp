import { uuidv7 } from 'uuidv7';
import { dbRun, dbGet } from '../utils/database';
import { transformLeave } from '../utils/transforms';

export const createLeaveApplication = async (_: any, { input }: { input: any }) => {
  const id = uuidv7();
  const now = Math.floor(Date.now() / 1000);
  
  await dbRun(
    'INSERT INTO leaves (id, activity_id, leave_type, reason, dr_covering_inbox, approval_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, input.activityId, input.leaveType || 'PERSONAL', input.reason, input.doctorCoveringInboxId, 'PENDING', now, now]
  );
  
  const leave = await dbGet('SELECT * FROM leaves WHERE id = ?', [id]);
  return transformLeave(leave);
};
