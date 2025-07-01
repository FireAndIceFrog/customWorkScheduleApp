import { dbRun, dbGet } from '../../../utils/database';
import { UpdateRoomRequest } from '../types/UpdateRoomRequest';
import { RoomResponse } from '../types/RoomResponse';
import { Room } from '../types/Room';

export const updateRoom = async (roomId: string, roomData: UpdateRoomRequest): Promise<RoomResponse> => {
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
      'SELECT * FROM rooms WHERE id = ?',
      [roomId]
    ) as Room;

    if (!existingRoom) {
      response.errors?.push('Room not found');
      response.message = 'Room with specified ID does not exist';
      return response;
    }

    // Check if new location exists (if being updated)
    if (roomData.location_id && roomData.location_id !== existingRoom.location_id) {
      const locationExists = await dbGet(
        'SELECT id FROM locations WHERE id = ?',
        [roomData.location_id]
      );
      
      if (!locationExists) {
        response.errors?.push('Location not found');
        response.message = 'Specified location does not exist';
        return response;
      }
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (roomData.room_name !== undefined) {
      updateFields.push('room_name = ?');
      updateValues.push(roomData.room_name);
    }

    if (roomData.room_number !== undefined) {
      updateFields.push('room_number = ?');
      updateValues.push(roomData.room_number);
    }

    if (roomData.location_id !== undefined) {
      updateFields.push('location_id = ?');
      updateValues.push(roomData.location_id);
    }

    if (roomData.capacity !== undefined) {
      updateFields.push('capacity = ?');
      updateValues.push(roomData.capacity);
    }

    if (updateFields.length === 0) {
      response.errors?.push('No fields to update');
      response.message = 'No valid update fields provided';
      return response;
    }

    // Add updated_at timestamp
    updateFields.push('updated_at = ?');
    updateValues.push(Math.floor(Date.now() / 1000));

    // Add room ID for WHERE clause
    updateValues.push(roomId);

    // Update room in database
    await dbRun(
      `UPDATE rooms SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Retrieve the updated room with location info
    const updatedRoom = await dbGet(
      `SELECT r.*, l.location_name 
       FROM rooms r 
       JOIN locations l ON r.location_id = l.id 
       WHERE r.id = ?`,
      [roomId]
    ) as Room;

    response.success = true;
    response.message = 'Room updated successfully';
    response.room = updatedRoom;

    return response;
  } catch (error) {
    response.errors?.push(`Failed to update room: ${error}`);
    response.message = `Database error: ${error}`;
    console.error('Error updating room:', error);
    return response;
  }
};
