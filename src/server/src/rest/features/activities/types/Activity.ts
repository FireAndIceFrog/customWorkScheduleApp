import { ActivityType } from "./ActivityType";

export interface Activity {
  id: string;
  start_time: number; // Unix timestamp
  end_time: number; // Unix timestamp
  doctor_id: string;
  room_id: string;
  activity_type: ActivityType; // BOOKING, LEAVE, etc.
  notes?: string;
  template_id?: string; // Links to template if generated
  generation_month?: string; // YYYY-MM format
  is_template_generated: number; // 1=generated, 0=manual
  created_at: number;
  updated_at: number;
  doctor_name?: string; // Full name of the doctor
  room_name?: string; // Name of the room
  location_name?: string; // Name of the location
}
