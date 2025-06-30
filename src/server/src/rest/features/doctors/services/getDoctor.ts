import { dbGet } from '../../../utils/database';
import { DoctorResponse } from '../types/DoctorResponse';
import { Doctor } from '../types/Doctor';

export const getDoctor = async (doctorId: string): Promise<DoctorResponse> => {
  const response: DoctorResponse = {
    success: false,
    message: '',
    errors: []
  };

  try {
    // Validate input
    if (!doctorId) {
      response.errors?.push('Doctor ID is required');
      response.message = 'Validation failed';
      return response;
    }

    // Retrieve doctor from database
    const doctor = await dbGet(
      'SELECT * FROM doctors WHERE id = ?',
      [doctorId]
    ) as Doctor;

    if (!doctor) {
      response.errors?.push('Doctor not found');
      response.message = 'Doctor with specified ID does not exist';
      return response;
    }

    response.success = true;
    response.message = 'Doctor retrieved successfully';
    response.doctor = doctor;

    return response;
  } catch (error) {
    response.errors?.push(`Failed to retrieve doctor: ${error}`);
    response.message = `Database error: ${error}`;
    console.error('Error retrieving doctor:', error);
    return response;
  }
};
