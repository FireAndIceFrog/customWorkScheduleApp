import { dbAll } from '../../../utils/database';
import { RoomResponse } from '../types/RoomResponse';
import { Room } from '../types/Room';

export const getRooms = async (): Promise<RoomResponse> => {
  const response: RoomResponse = {
    success: false,
    message: '',
    errors: []
  };

  try {
    // Retrieve all rooms from database with location info
    const rooms = await dbAll(
      `SELECT r.*, l.location_name 
       FROM rooms r 
       JOIN locations l ON r.location_id = l.id 
       ORDER BY l.location_name, r.room_name`
    ) as Room[];

    response.success = true;
    response.message = `Retrieved ${rooms.length} rooms`;
    response.rooms = rooms;

    return response;
  } catch (error) {
    response.errors?.push(`Failed to retrieve rooms: ${error}`);
    response.message = `Database error: ${error}`;
    console.error('Error retrieving rooms:', error);
    return response;
  }
};
