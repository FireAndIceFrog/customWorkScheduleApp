import { dbAll } from '../../../utils/database';
import { DoctorResponse } from '../types/DoctorResponse';
import { Doctor } from '../types/Doctor';

export const getDoctors = async (): Promise<DoctorResponse> => {
  const response: DoctorResponse = {
    success: false,
    message: '',
    errors: []
  };

  try {
    // Retrieve all doctors from database
    const doctors = await dbAll(
      'SELECT * FROM doctors ORDER BY last_name, first_name'
    ) as Doctor[];

    response.success = true;
    response.message = `Retrieved ${doctors.length} doctors`;
    response.doctors = doctors;

    return response;
  } catch (error) {
    response.errors?.push(`Failed to retrieve doctors: ${error}`);
    response.message = `Database error: ${error}`;
    console.error('Error retrieving doctors:', error);
    return response;
  }
};
