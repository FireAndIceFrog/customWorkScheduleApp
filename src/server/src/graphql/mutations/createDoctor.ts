import { uuidv7 } from 'uuidv7';
import { dbRun, dbGet } from '../utils/database';
import { transformDoctor } from '../utils/transforms';

export const createDoctor = async (_: any, { input }: { input: any }) => {
  const id = uuidv7();
  const now = Math.floor(Date.now() / 1000);
  
  await dbRun(
    'INSERT INTO doctors (id, first_name, last_name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, input.firstName, input.lastName, input.email, now, now]
  );
  
  const doctor = await dbGet('SELECT * FROM doctors WHERE id = ?', [id]);
  return transformDoctor(doctor);
};
