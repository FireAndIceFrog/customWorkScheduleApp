import { Room } from './Room';

export interface RoomResponse {
  success: boolean;
  message: string;
  room?: Room;
  rooms?: Room[];
  errors?: string[];
}
