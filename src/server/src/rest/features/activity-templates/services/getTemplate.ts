import { dbGet } from '../../../utils/database';
import { TemplateResponse } from '../types/TemplateResponse';
import { ActivityTemplate } from '../types/ActivityTemplate';

export const getTemplate = async (templateId: string): Promise<TemplateResponse> => {
  const response: TemplateResponse = {
    success: false,
    message: '',
    errors: []
  };

  try {
    // Validate input
    if (!templateId) {
      response.errors?.push('Template ID is required');
      response.message = 'Validation failed';
      return response;
    }

    // Retrieve template with related information
    const template = await dbGet(
      `SELECT 
        t.*, 
        d.first_name || ' ' || d.last_name as doctor_name,
        r.room_name,
        l.location_name
       FROM activity_templates t
       JOIN doctors d ON t.doctor_id = d.id
       JOIN rooms r ON t.room_id = r.id
       JOIN locations l ON r.location_id = l.id
       WHERE t.id = ?`,
      [templateId]
    ) as ActivityTemplate;

    if (!template) {
      response.errors?.push('Template not found');
      response.message = 'Template with specified ID does not exist';
      return response;
    }

    response.success = true;
    response.message = 'Template retrieved successfully';
    response.template = template;

    return response;
  } catch (error) {
    response.errors?.push(`Failed to retrieve template: ${error}`);
    response.message = `Database error: ${error}`;
    console.error('Error retrieving template:', error);
    return response;
  }
};
