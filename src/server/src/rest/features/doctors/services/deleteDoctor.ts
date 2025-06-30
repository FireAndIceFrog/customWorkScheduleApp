import { dbRun, dbGet } from '../../../utils/database';
import { DoctorResponse } from '../types/DoctorResponse';
import { Doctor } from '../types/Doctor';

export const deleteDoctor = async (doctorId: string): Promise<DoctorResponse> => {
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

    // Check if doctor exists
    const existingDoctor = await dbGet(
      'SELECT * FROM doctors WHERE id = ?',
      [doctorId]
    ) as Doctor;

    if (!existingDoctor) {
      response.errors?.push('Doctor not found');
      response.message = 'Doctor with specified ID does not exist';
      return response;
    }

    // Check if doctor has associated activities
    const hasActivities = await dbGet(
      'SELECT COUNT(*) as count FROM activities WHERE doctor_id = ?',
      [doctorId]
    );

    if (hasActivities && hasActivities.count > 0) {
      response.errors?.push('Cannot delete doctor with existing activities');
      response.message = 'Doctor has associated activities and cannot be deleted';
      return response;
    }

    // Delete doctor from database
    const result = await dbRun(
      'DELETE FROM doctors WHERE id = ?',
      [doctorId]
    );

    if (result.changes === 0) {
      response.errors?.push('Doctor not found');
      response.message = 'Doctor with specified ID does not exist';
      return response;
    }

    response.success = true;
    response.message = 'Doctor deleted successfully';
    response.doctor = existingDoctor;

    return response;
  } catch (error) {
    response.errors?.push(`Failed to delete doctor: ${error}`);
    response.message = `Database error: ${error}`;
    console.error('Error deleting doctor:', error);
    return response;
  }
};
