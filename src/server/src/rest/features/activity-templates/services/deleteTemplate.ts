import { dbRun, dbGet } from '../../../utils/database';
import { TemplateResponse } from '../types/TemplateResponse';
import { ActivityTemplate } from '../types/ActivityTemplate';

export const deleteTemplate = async (templateId: string): Promise<TemplateResponse> => {
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

    // Check if template exists
    const existingTemplate = await dbGet(
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

    if (!existingTemplate) {
      response.errors?.push('Template not found');
      response.message = 'Template with specified ID does not exist';
      return response;
    }

    // Check if template has associated generated activities
    const hasGeneratedActivities = await dbGet(
      'SELECT COUNT(*) as count FROM activities WHERE template_id = ?',
      [templateId]
    );

    if (hasGeneratedActivities && hasGeneratedActivities.count > 0) {
      response.errors?.push('Cannot delete template with existing generated activities');
      response.message = 'Template has associated activities and cannot be deleted. Consider deactivating instead.';
      return response;
    }

    // Delete template from database
    const result = await dbRun(
      'DELETE FROM activity_templates WHERE id = ?',
      [templateId]
    );

    if (result.changes === 0) {
      response.errors?.push('Template not found');
      response.message = 'Template with specified ID does not exist';
      return response;
    }

    response.success = true;
    response.message = 'Template deleted successfully';
    response.template = existingTemplate;

    return response;
  } catch (error) {
    response.errors?.push(`Failed to delete template: ${error}`);
    response.message = `Database error: ${error}`;
    console.error('Error deleting template:', error);
    return response;
  }
};
