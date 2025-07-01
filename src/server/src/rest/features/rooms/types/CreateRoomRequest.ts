export interface CreateRoomRequest {
  room_name: string;
  room_number?: string;
  location_id: string;
  capacity?: number;
}
