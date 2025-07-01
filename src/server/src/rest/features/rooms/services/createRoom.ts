import { uuidv7 } from 'uuidv7';
import { dbRun, dbGet } from '../../../utils/database';
import { CreateRoomRequest } from '../types/CreateRoomRequest';
import { RoomResponse } from '../types/RoomResponse';
import { Room } from '../types/Room';

export const createRoom = async (roomData: CreateRoomRequest): Promise<RoomResponse> => {
  const response: RoomResponse = {
    success: false,
    message: '',
    errors: []
  };

  try {
    // Validate input
    if (!roomData.room_name || !roomData.location_id) {
      response.errors?.push('Room name and location ID are required');
      response.message = 'Validation failed';
      return response;
    }

    // Check if location exists
    const locationExists = await dbGet(
      'SELECT id FROM locations WHERE id = ?',
      [roomData.location_id]
    );
    
    if (!locationExists) {
      response.errors?.push('Location not found');
      response.message = 'Specified location does not exist';
      return response;
    }

    // Generate UUID and timestamp
    const roomId = uuidv7();
    const currentTime = Math.floor(Date.now() / 1000);

    // Insert room into database
    await dbRun(
      `INSERT INTO rooms (id, room_name, room_number, location_id, capacity, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        roomId,
        roomData.room_name,
        roomData.room_number || null,
        roomData.location_id,
        roomData.capacity || 1,
        currentTime,
        currentTime
      ]
    );

    // Retrieve the created room
    const createdRoom = await dbGet(
      'SELECT * FROM rooms WHERE id = ?',
      [roomId]
    ) as Room;

    response.success = true;
    response.message = 'Room created successfully';
    response.room = createdRoom;

    return response;
  } catch (error) {
    response.errors?.push(`Failed to create room: ${error}`);
    response.message = `Database error: ${error}`;
    console.error('Error creating room:', error);
    return response;
  }
};
