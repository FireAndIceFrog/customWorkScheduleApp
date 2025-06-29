// Helper function to convert Unix timestamp to ISO string
export const timestampToISO = (timestamp: number): string => {
  return new Date(timestamp * 1000).toISOString();
};

// Helper function to convert ISO string to Unix timestamp
export const isoToTimestamp = (isoString: string): number => {
  return Math.floor(new Date(isoString).getTime() / 1000);
};

// Helper function to get day name from day of week number
export const getDayName = (dayOfWeek: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek] || 'Unknown';
};

// Transform doctor database row to GraphQL type
export const transformDoctor = (doctor: any) => ({
  ...doctor,
  firstName: doctor.first_name,
  lastName: doctor.last_name,
  createdAt: timestampToISO(doctor.created_at),
  updatedAt: timestampToISO(doctor.updated_at)
});

// Transform location database row to GraphQL type
export const transformLocation = (location: any) => ({
  ...location,
  locationName: location.location_name,
  locationKey: location.location_key,
  createdAt: timestampToISO(location.created_at),
  updatedAt: timestampToISO(location.updated_at)
});

// Transform room database row to GraphQL type
export const transformRoom = (room: any) => ({
  ...room,
  roomName: room.room_name,
  roomNumber: room.room_number,
  locationId: room.location_id,
  createdAt: timestampToISO(room.created_at),
  updatedAt: timestampToISO(room.updated_at)
});

// Transform activity database row to GraphQL type
export const transformActivity = (activity: any) => ({
  ...activity,
  doctorId: activity.doctor_id,
  roomId: activity.room_id,
  activityType: activity.activity_type,
  templateId: activity.template_id,
  generationMonth: activity.generation_month,
  isTemplateGenerated: Boolean(activity.is_template_generated),
  startTime: timestampToISO(activity.start_time),
  endTime: timestampToISO(activity.end_time),
  createdAt: timestampToISO(activity.created_at),
  updatedAt: timestampToISO(activity.updated_at)
});

// Transform leave database row to GraphQL type
export const transformLeave = (leave: any) => ({
  ...leave,
  activityId: leave.activity_id,
  leaveType: leave.leave_type,
  doctorCoveringInboxId: leave.dr_covering_inbox,
  approvalStatus: leave.approval_status,
  createdAt: timestampToISO(leave.created_at),
  updatedAt: timestampToISO(leave.updated_at)
});

// Transform activity template database row to GraphQL type
export const transformActivityTemplate = (template: any) => ({
  ...template,
  doctorId: template.doctor_id,
  roomId: template.room_id,
  dayOfWeek: template.day_of_week,
  startTime: template.start_time,
  endTime: template.end_time,
  templateName: template.template_name,
  isActive: Boolean(template.is_active),
  dayName: getDayName(template.day_of_week),
  createdAt: timestampToISO(template.created_at),
  updatedAt: timestampToISO(template.updated_at)
});

// Transform generation log database row to GraphQL type
export const transformGenerationLog = (log: any) => ({
  ...log,
  generationMonth: log.generation_month,
  totalTemplatesProcessed: log.total_templates_processed,
  totalActivitiesGenerated: log.total_activities_generated,
  totalConflictsSkipped: log.total_conflicts_skipped,
  generationStatus: log.generation_status,
  errorMessage: log.error_message,
  generatedAt: timestampToISO(log.generated_at),
  generatedBy: log.generated_by,
  successRatePercent: log.total_templates_processed === 0 ? 0 : 
    Math.round((log.total_activities_generated / log.total_templates_processed) * 100 * 100) / 100
});
