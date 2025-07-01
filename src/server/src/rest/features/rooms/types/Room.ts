export interface Room {
  id: string;
  room_name: string;
  room_number?: string;
  location_id: string;
  location_name: string; 
  capacity: number;
  created_at: number;
  updated_at: number;
}
