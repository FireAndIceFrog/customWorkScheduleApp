import { dbAll } from '../../../utils/database';
import { TemplateResponse } from '../types/TemplateResponse';
import { ActivityTemplate } from '../types/ActivityTemplate';

export const getTemplatesByDoctor = async (doctorId: string): Promise<TemplateResponse> => {
  const response: TemplateResponse = {
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

    // Retrieve templates for specific doctor
    const templates = await dbAll(
      `SELECT 
        t.*, 
        d.first_name || ' ' || d.last_name as doctor_name,
        r.room_name,
        l.location_name
       FROM activity_templates t
       JOIN doctors d ON t.doctor_id = d.id
       JOIN rooms r ON t.room_id = r.id
       JOIN locations l ON r.location_id = l.id
       WHERE t.doctor_id = ?
       ORDER BY t.day_of_week, t.start_time`,
      [doctorId]
    ) as ActivityTemplate[];

    response.success = true;
    response.message = `Retrieved ${templates.length} templates for doctor`;
    response.templates = templates;

    return response;
  } catch (error) {
    response.errors?.push(`Failed to retrieve templates by doctor: ${error}`);
    response.message = `Database error: ${error}`;
    console.error('Error retrieving templates by doctor:', error);
    return response;
  }
};
