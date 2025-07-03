export interface ActivityFilter {
  id?: string;
  doctor_id?: string;
  room_id?: string;
  start_date?: string; // YYYY-MM-DD format
  end_date?: string; // YYYY-MM-DD format
  activity_type?: string;
  is_template_generated?: number; // 0 or 1
  generation_month?: string; // YYYY-MM format
}
