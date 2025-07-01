import { dbAll } from '../../../utils/database';
import { TemplateResponse } from '../types/TemplateResponse';
import { ActivityTemplate } from '../types/ActivityTemplate';

export const getTemplates = async (): Promise<TemplateResponse> => {
  const response: TemplateResponse = {
    success: false,
    message: '',
    errors: []
  };

  try {
    // Retrieve all templates with related information
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
       ORDER BY d.last_name, d.first_name, t.day_of_week, t.start_time`
    ) as ActivityTemplate[];

    response.success = true;
    response.message = `Retrieved ${templates.length} activity templates`;
    response.templates = templates;

    return response;
  } catch (error) {
    response.errors?.push(`Failed to retrieve templates: ${error}`);
    response.message = `Database error: ${error}`;
    console.error('Error retrieving templates:', error);
    return response;
  }
};
