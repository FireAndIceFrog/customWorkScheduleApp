export interface CreateTemplateRequest {
  doctor_id: string;
  room_id: string;
  day_of_week: number; // 0=Sunday, 6=Saturday
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  template_name?: string;
  is_active?: number; // defaults to 1
}
