import { uuidv7 } from 'uuidv7';
import { dbRun, dbGet } from '../../../utils/database';
import { CreateTemplateRequest } from '../types/CreateTemplateRequest';
import { TemplateResponse } from '../types/TemplateResponse';
import { ActivityTemplate } from '../types/ActivityTemplate';

export const createTemplate = async (templateData: CreateTemplateRequest): Promise<TemplateResponse> => {
  const response: TemplateResponse = {
    success: false,
    message: '',
    errors: []
  };

  try {
    // Validate input
    if (!templateData.doctor_id || !templateData.room_id || 
        templateData.day_of_week === undefined || 
        !templateData.start_time || !templateData.end_time) {
      response.errors?.push('Doctor ID, room ID, day of week, start time, and end time are required');
      response.message = 'Validation failed';
      return response;
    }

    // Validate day_of_week range
    if (templateData.day_of_week < 0 || templateData.day_of_week > 6) {
      response.errors?.push('Day of week must be between 0 (Sunday) and 6 (Saturday)');
      response.message = 'Validation failed';
      return response;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(templateData.start_time) || !timeRegex.test(templateData.end_time)) {
      response.errors?.push('Start time and end time must be in HH:MM format');
      response.message = 'Validation failed';
      return response;
    }

    // Validate start time before end time
    if (templateData.start_time >= templateData.end_time) {
      response.errors?.push('Start time must be before end time');
      response.message = 'Validation failed';
      return response;
    }

    // Check if doctor exists
    const doctorExists = await dbGet(
      'SELECT id FROM doctors WHERE id = ?',
      [templateData.doctor_id]
    );
    
    if (!doctorExists) {
      response.errors?.push('Doctor not found');
      response.message = 'Specified doctor does not exist';
      return response;
    }

    // Check if room exists
    const roomExists = await dbGet(
      'SELECT id FROM rooms WHERE id = ?',
      [templateData.room_id]
    );
    
    if (!roomExists) {
      response.errors?.push('Room not found');
      response.message = 'Specified room does not exist';
      return response;
    }

    // Check for duplicate template
    const duplicateTemplate = await dbGet(
      'SELECT id FROM activity_templates WHERE doctor_id = ? AND room_id = ? AND day_of_week = ? AND start_time = ? AND end_time = ?',
      [templateData.doctor_id, templateData.room_id, templateData.day_of_week, templateData.start_time, templateData.end_time]
    );
    
    if (duplicateTemplate) {
      response.errors?.push('Template already exists for this doctor, room, day, and time');
      response.message = 'Duplicate template not allowed';
      return response;
    }

    // Generate UUID and timestamp
    const templateId = uuidv7();
    const currentTime = Math.floor(Date.now() / 1000);

    // Insert template into database
    await dbRun(
      `INSERT INTO activity_templates (id, doctor_id, room_id, day_of_week, start_time, end_time, template_name, is_active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        templateId,
        templateData.doctor_id,
        templateData.room_id,
        templateData.day_of_week,
        templateData.start_time,
        templateData.end_time,
        templateData.template_name || null,
        templateData.is_active ?? 1,
        currentTime,
        currentTime
      ]
    );

    // Retrieve the created template
    const createdTemplate = await dbGet(
      'SELECT * FROM activity_templates WHERE id = ?',
      [templateId]
    ) as ActivityTemplate;

    response.success = true;
    response.message = 'Activity template created successfully';
    response.template = createdTemplate;

    return response;
  } catch (error) {
    response.errors?.push(`Failed to create template: ${error}`);
    response.message = `Database error: ${error}`;
    console.error('Error creating template:', error);
    return response;
  }
};
