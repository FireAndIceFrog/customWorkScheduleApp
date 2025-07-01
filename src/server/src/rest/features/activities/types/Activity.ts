export interface Activity {
  id: string;
  start_time: number; // Unix timestamp
  end_time: number; // Unix timestamp
  doctor_id: string;
  room_id: string;
  activity_type: string; // BOOKING, LEAVE, etc.
  notes?: string;
  template_id?: string; // Links to template if generated
  generation_month?: string; // YYYY-MM format
  is_template_generated: number; // 1=generated, 0=manual
  created_at: number;
  updated_at: number;
}
