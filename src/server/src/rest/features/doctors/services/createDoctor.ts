import { uuidv7 } from 'uuidv7';
import { dbRun, dbGet } from '../../../utils/database';
import { CreateDoctorRequest } from '../types/CreateDoctorRequest';
import { DoctorResponse } from '../types/DoctorResponse';
import { Doctor } from '../types/Doctor';

export const createDoctor = async (doctorData: CreateDoctorRequest): Promise<DoctorResponse> => {
  const response: DoctorResponse = {
    success: false,
    message: '',
    errors: []
  };

  try {
    // Validate input
    if (!doctorData.first_name || !doctorData.last_name) {
      response.errors?.push('First name and last name are required');
      response.message = 'Validation failed';
      return response;
    }

    // Check if email already exists (if provided)
    if (doctorData.email) {
      const existingDoctor = await dbGet(
        'SELECT id FROM doctors WHERE email = ?',
        [doctorData.email]
      );
      
      if (existingDoctor) {
        response.errors?.push('Email already exists');
        response.message = 'Doctor with this email already exists';
        return response;
      }
    }

    // Generate UUID and timestamp
    const doctorId = uuidv7();
    const currentTime = Math.floor(Date.now() / 1000);

    // Insert doctor into database
    await dbRun(
      `INSERT INTO doctors (id, first_name, last_name, email, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        doctorId,
        doctorData.first_name,
        doctorData.last_name,
        doctorData.email || null,
        currentTime,
        currentTime
      ]
    );

    // Retrieve the created doctor
    const createdDoctor = await dbGet(
      'SELECT * FROM doctors WHERE id = ?',
      [doctorId]
    ) as Doctor;

    response.success = true;
    response.message = 'Doctor created successfully';
    response.doctor = createdDoctor;

    return response;
  } catch (error) {
    response.errors?.push(`Failed to create doctor: ${error}`);
    response.message = `Database error: ${error}`;
    console.error('Error creating doctor:', error);
    return response;
  }
};
