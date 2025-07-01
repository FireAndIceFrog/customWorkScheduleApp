import { dbRun, dbGet } from '../../../utils/database';
import { RoomResponse } from '../types/RoomResponse';
import { Room } from '../types/Room';

export const deleteRoom = async (roomId: string): Promise<RoomResponse> => {
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

    // Check if room exists
    const existingRoom = await dbGet(
      `SELECT r.*, l.location_name 
       FROM rooms r 
       JOIN locations l ON r.location_id = l.id 
       WHERE r.id = ?`,
      [roomId]
    ) as Room;

    if (!existingRoom) {
      response.errors?.push('Room not found');
      response.message = 'Room with specified ID does not exist';
      return response;
    }

    // Check if room has associated activities
    const hasActivities = await dbGet(
      'SELECT COUNT(*) as count FROM activities WHERE room_id = ?',
      [roomId]
    );

    if (hasActivities && hasActivities.count > 0) {
      response.errors?.push('Cannot delete room with existing activities');
      response.message = 'Room has associated activities and cannot be deleted';
      return response;
    }

    // Delete room from database
    const result = await dbRun(
      'DELETE FROM rooms WHERE id = ?',
      [roomId]
    );

    if (result.changes === 0) {
      response.errors?.push('Room not found');
      response.message = 'Room with specified ID does not exist';
      return response;
    }

    response.success = true;
    response.message = 'Room deleted successfully';
    response.room = existingRoom;

    return response;
  } catch (error) {
    response.errors?.push(`Failed to delete room: ${error}`);
    response.message = `Database error: ${error}`;
    console.error('Error deleting room:', error);
    return response;
  }
};
