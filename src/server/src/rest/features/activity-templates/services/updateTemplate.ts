import { dbRun, dbGet } from '../../../utils/database';
import { UpdateTemplateRequest } from '../types/UpdateTemplateRequest';
import { TemplateResponse } from '../types/TemplateResponse';
import { ActivityTemplate } from '../types/ActivityTemplate';

export const updateTemplate = async (templateId: string, templateData: UpdateTemplateRequest): Promise<TemplateResponse> => {
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
      'SELECT * FROM activity_templates WHERE id = ?',
      [templateId]
    ) as ActivityTemplate;

    if (!existingTemplate) {
      response.errors?.push('Template not found');
      response.message = 'Template with specified ID does not exist';
      return response;
    }

    // Validate day_of_week if provided
    if (templateData.day_of_week !== undefined && (templateData.day_of_week < 0 || templateData.day_of_week > 6)) {
      response.errors?.push('Day of week must be between 0 (Sunday) and 6 (Saturday)');
      response.message = 'Validation failed';
      return response;
    }

    // Validate time format if provided
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (templateData.start_time && !timeRegex.test(templateData.start_time)) {
      response.errors?.push('Start time must be in HH:MM format');
      response.message = 'Validation failed';
      return response;
    }
    if (templateData.end_time && !timeRegex.test(templateData.end_time)) {
      response.errors?.push('End time must be in HH:MM format');
      response.message = 'Validation failed';
      return response;
    }

    // Validate start time before end time (if both are being updated)
    const newStartTime = templateData.start_time || existingTemplate.start_time;
    const newEndTime = templateData.end_time || existingTemplate.end_time;
    if (newStartTime >= newEndTime) {
      response.errors?.push('Start time must be before end time');
      response.message = 'Validation failed';
      return response;
    }

    // Check if doctor exists (if being updated)
    if (templateData.doctor_id) {
      const doctorExists = await dbGet(
        'SELECT id FROM doctors WHERE id = ?',
        [templateData.doctor_id]
      );
      
      if (!doctorExists) {
        response.errors?.push('Doctor not found');
        response.message = 'Specified doctor does not exist';
        return response;
      }
    }

    // Check if room exists (if being updated)
    if (templateData.room_id) {
      const roomExists = await dbGet(
        'SELECT id FROM rooms WHERE id = ?',
        [templateData.room_id]
      );
      
      if (!roomExists) {
        response.errors?.push('Room not found');
        response.message = 'Specified room does not exist';
        return response;
      }
    }

    // Check for duplicate template (if key fields are being updated)
    if (templateData.doctor_id || templateData.room_id || templateData.day_of_week !== undefined || 
        templateData.start_time || templateData.end_time) {
      const newDoctorId = templateData.doctor_id || existingTemplate.doctor_id;
      const newRoomId = templateData.room_id || existingTemplate.room_id;
      const newDayOfWeek = templateData.day_of_week !== undefined ? templateData.day_of_week : existingTemplate.day_of_week;
      
      const duplicateTemplate = await dbGet(
        'SELECT id FROM activity_templates WHERE doctor_id = ? AND room_id = ? AND day_of_week = ? AND start_time = ? AND end_time = ? AND id != ?',
        [newDoctorId, newRoomId, newDayOfWeek, newStartTime, newEndTime, templateId]
      );
      
      if (duplicateTemplate) {
        response.errors?.push('Template already exists for this doctor, room, day, and time');
        response.message = 'Duplicate template not allowed';
        return response;
      }
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (templateData.doctor_id !== undefined) {
      updateFields.push('doctor_id = ?');
      updateValues.push(templateData.doctor_id);
    }

    if (templateData.room_id !== undefined) {
      updateFields.push('room_id = ?');
      updateValues.push(templateData.room_id);
    }

    if (templateData.day_of_week !== undefined) {
      updateFields.push('day_of_week = ?');
      updateValues.push(templateData.day_of_week);
    }

    if (templateData.start_time !== undefined) {
      updateFields.push('start_time = ?');
      updateValues.push(templateData.start_time);
    }

    if (templateData.end_time !== undefined) {
      updateFields.push('end_time = ?');
      updateValues.push(templateData.end_time);
    }

    if (templateData.template_name !== undefined) {
      updateFields.push('template_name = ?');
      updateValues.push(templateData.template_name);
    }

    if (templateData.is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(templateData.is_active);
    }

    if (updateFields.length === 0) {
      response.errors?.push('No fields to update');
      response.message = 'No valid update fields provided';
      return response;
    }

    // Add updated_at timestamp
    updateFields.push('updated_at = ?');
    updateValues.push(Math.floor(Date.now() / 1000));

    // Add template ID for WHERE clause
    updateValues.push(templateId);

    // Update template in database
    await dbRun(
      `UPDATE activity_templates SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Retrieve the updated template with related information
    const updatedTemplate = await dbGet(
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

    response.success = true;
    response.message = 'Template updated successfully';
    response.template = updatedTemplate;

    return response;
  } catch (error) {
    response.errors?.push(`Failed to update template: ${error}`);
    response.message = `Database error: ${error}`;
    console.error('Error updating template:', error);
    return response;
  }
};
