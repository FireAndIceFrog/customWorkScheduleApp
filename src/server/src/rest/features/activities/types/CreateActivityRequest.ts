export interface CreateActivityRequest {
  start_time: number; // Unix timestamp
  end_time: number; // Unix timestamp
  doctor_id: string;
  room_id: string;
  activity_type?: string; // defaults to 'BOOKING'
  notes?: string;
  template_id?: string; // Links to template if generated, 
  generation_month?: string; // YYYY-MM format,
}
