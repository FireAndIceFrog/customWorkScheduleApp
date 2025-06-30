import { dbRun, dbGet } from '../../../utils/database';
import { UpdateDoctorRequest } from '../types/UpdateDoctorRequest';
import { DoctorResponse } from '../types/DoctorResponse';
import { Doctor } from '../types/Doctor';

export const updateDoctor = async (doctorId: string, doctorData: UpdateDoctorRequest): Promise<DoctorResponse> => {
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

    // Check if email already exists (if being updated)
    if (doctorData.email && doctorData.email !== existingDoctor.email) {
      const emailExists = await dbGet(
        'SELECT id FROM doctors WHERE email = ? AND id != ?',
        [doctorData.email, doctorId]
      );
      
      if (emailExists) {
        response.errors?.push('Email already exists');
        response.message = 'Another doctor with this email already exists';
        return response;
      }
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (doctorData.first_name !== undefined) {
      updateFields.push('first_name = ?');
      updateValues.push(doctorData.first_name);
    }

    if (doctorData.last_name !== undefined) {
      updateFields.push('last_name = ?');
      updateValues.push(doctorData.last_name);
    }

    if (doctorData.email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(doctorData.email);
    }

    if (updateFields.length === 0) {
      response.errors?.push('No fields to update');
      response.message = 'No valid update fields provided';
      return response;
    }

    // Add updated_at timestamp
    updateFields.push('updated_at = ?');
    updateValues.push(Math.floor(Date.now() / 1000));

    // Add doctor ID for WHERE clause
    updateValues.push(doctorId);

    // Update doctor in database
    await dbRun(
      `UPDATE doctors SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Retrieve the updated doctor
    const updatedDoctor = await dbGet(
      'SELECT * FROM doctors WHERE id = ?',
      [doctorId]
    ) as Doctor;

    response.success = true;
    response.message = 'Doctor updated successfully';
    response.doctor = updatedDoctor;

    return response;
  } catch (error) {
    response.errors?.push(`Failed to update doctor: ${error}`);
    response.message = `Database error: ${error}`;
    console.error('Error updating doctor:', error);
    return response;
  }
};
