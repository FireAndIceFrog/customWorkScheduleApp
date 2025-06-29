import { dbAll } from '../utils/database';
import { transformDoctor } from '../utils/transforms';

export const doctors = async () => {
  const doctors = await dbAll('SELECT * FROM doctors ORDER BY last_name, first_name');
  return doctors.map(transformDoctor);
};
