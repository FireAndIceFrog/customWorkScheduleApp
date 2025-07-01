import { dbGet } from '../../../utils/database';
import { RoomResponse } from '../types/RoomResponse';
import { Room } from '../types/Room';

export const getRoom = async (roomId: string): Promise<RoomResponse> => {
  const response: RoomResponse = {
    success: false,
    message: '',
    errors: []
  };

  try {
    // Validate input
    if (!roomId) {
      response.errors?.push('Room ID is required');
      response.message = 'Validation failed';
      return response;
    }

    // Retrieve room from database with location info
    const room = await dbGet(
      `SELECT r.*, l.location_name 
       FROM rooms r 
       JOIN locations l ON r.location_id = l.id 
       WHERE r.id = ?`,
      [roomId]
    ) as Room;

    if (!room) {
      response.errors?.push('Room not found');
      response.message = 'Room with specified ID does not exist';
      return response;
    }

    response.success = true;
    response.message = 'Room retrieved successfully';
    response.room = room;

    return response;
  } catch (error) {
    response.errors?.push(`Failed to retrieve room: ${error}`);
    response.message = `Database error: ${error}`;
    console.error('Error retrieving room:', error);
    return response;
  }
};
