import { dbGet } from '../utils/database';
import { transformDoctor } from '../utils/transforms';

export const doctor = async (_: any, { id }: { id: string }) => {
  const doctor = await dbGet('SELECT * FROM doctors WHERE id = ?', [id]);
  return doctor ? transformDoctor(doctor) : null;
};
