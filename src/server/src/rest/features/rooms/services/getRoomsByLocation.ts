import { dbAll } from '../../../utils/database';
import { RoomResponse } from '../types/RoomResponse';
import { Room } from '../types/Room';

export const getRoomsByLocation = async (locationId: string): Promise<RoomResponse> => {
  const response: RoomResponse = {
    success: false,
    message: '',
    errors: []
  };

  try {
    // Validate input
    if (!locationId) {
      response.errors?.push('Location ID is required');
      response.message = 'Validation failed';
      return response;
    }

    // Retrieve rooms for specific location
    const rooms = await dbAll(
      `SELECT r.*, l.location_name 
       FROM rooms r 
       JOIN locations l ON r.location_id = l.id 
       WHERE r.location_id = ? 
       ORDER BY r.room_name`,
      [locationId]
    ) as Room[];

    response.success = true;
    response.message = `Retrieved ${rooms.length} rooms for location`;
    response.rooms = rooms;

    return response;
  } catch (error) {
    response.errors?.push(`Failed to retrieve rooms by location: ${error}`);
    response.message = `Database error: ${error}`;
    console.error('Error retrieving rooms by location:', error);
    return response;
  }
};
