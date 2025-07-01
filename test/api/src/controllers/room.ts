import { BaseController } from './baseController';
import { Room, CreateRoomRequest, UpdateRoomRequest, RoomResponse } from '@local/server';

export class RoomController extends BaseController {
  constructor(
    baseUrl: string,
    apiKey: string,
    headers: Record<string, string> = {}
  ) {
    super(baseUrl, apiKey, headers);
  }

  /**
   * Create a new room
   */
  async createRoom(roomData: CreateRoomRequest): Promise<RoomResponse> {
    const response = await this.fetchJson<RoomResponse>('/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
    return response;
  }

  /**
   * Get all rooms
   */
  async getRooms(): Promise<RoomResponse> {
    const response = await this.fetchJson<RoomResponse>('/rooms');
    return response;
  }

  /**
   * Get a specific room by ID
   */
  async getRoom(id: string): Promise<RoomResponse> {
    const response = await this.fetchJson<RoomResponse>(`/rooms/${id}`);
    return response;
  }

  /**
   * Get rooms by location ID
   */
  async getRoomsByLocationId(locationId: string): Promise<RoomResponse> {
    const response = await this.fetchJson<RoomResponse>(`/locations/${locationId}/rooms`);
    return response;
  }

  /**
   * Update a room
   */
  async updateRoom(id: string, updateData: UpdateRoomRequest): Promise<RoomResponse> {
    const response = await this.fetchJson<RoomResponse>(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return response;
  }

  /**
   * Delete a room
   */
  async deleteRoom(id: string): Promise<RoomResponse> {
    const response = await this.fetchJson<RoomResponse>(`/rooms/${id}`, {
      method: 'DELETE',
    });
    return response;
  }

  /**
   * Find room by name
   */
  async findRoomByName(roomName: string): Promise<Room | undefined> {
    const response = await this.getRooms();
    if (response.success && response.rooms) {
      return response.rooms.find(room => room.room_name === roomName);
    }
    return undefined;
  }

  /**
   * Get rooms by location name
   */
  async getRoomsByLocationName(locationName: string): Promise<Room[]> {
    const response = await this.getRooms();
    if (response.success && response.rooms) {
      return response.rooms.filter(room => room.location_name === locationName);
    }
    return [];
  }

  /**
   * Delete room by name (for test cleanup)
   */
  async deleteRoomByName(roomName: string): Promise<RoomResponse> {
    const room = await this.findRoomByName(roomName);
    if (room) {
      return await this.deleteRoom(room.id);
    }
    return {
      success: false,
      message: `Room not found: ${roomName}`,
      errors: ['Room not found']
    };
  }

  /**
   * Create room with validation
   */
  async createRoomWithValidation(roomData: Partial<CreateRoomRequest>): Promise<RoomResponse> {
    try {
      const response = await this.createRoom(roomData as CreateRoomRequest);
      return response;
    } catch (error) {
      return {
        success: false,
        message: 'Validation failed',
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Attempt to create room with invalid data (for negative testing)
   */
  async attemptCreateWithoutRequiredFields(): Promise<RoomResponse> {
    return await this.createRoomWithValidation({});
  }

  /**
   * Attempt to create room with non-existent location
   */
  async attemptCreateWithNonExistentLocation(): Promise<RoomResponse> {
    return await this.createRoomWithValidation({
      room_name: 'Test Room',
      location_id: 'non-existent-location-id'
    });
  }

  /**
   * Update room with partial data
   */
  async updateRoomPartial(roomName: string, updateData: Partial<UpdateRoomRequest>): Promise<RoomResponse> {
    const room = await this.findRoomByName(roomName);
    if (room) {
      return await this.updateRoom(room.id, updateData);
    }
    return {
      success: false,
      message: `Room not found: ${roomName}`,
      errors: ['Room not found']
    };
  }

  /**
   * Update room location by name
   */
  async updateRoomLocationByName(roomName: string, newLocationId: string): Promise<RoomResponse> {
    const room = await this.findRoomByName(roomName);
    if (room) {
      return await this.updateRoom(room.id, { location_id: newLocationId });
    }
    return {
      success: false,
      message: `Room not found: ${roomName}`,
      errors: ['Room not found']
    };
  }

  /**
   * Create room without capacity (testing defaults)
   */
  async createRoomWithoutCapacity(roomData: Omit<CreateRoomRequest, 'capacity'>): Promise<RoomResponse> {
    return await this.createRoom(roomData);
  }

  /**
   * Clean up all test rooms (for test cleanup)
   */
  async cleanupTestRooms(): Promise<void> {
    const response = await this.getRooms();
    if (response.success && response.rooms) {
      // Only clean up rooms with TEST prefix or test-related names for safety
      const testRooms = response.rooms.filter(room => 
        room.room_name.includes('TEST_') ||
        room.location_name.includes('TEST_') ||
        room.room_name.includes('Test') ||
        room.room_name.includes('Consultation') ||
        room.room_name.includes('Surgery') ||
        room.room_name.includes('General') ||
        room.room_name.includes('Mobile') ||
        room.room_name.includes('Default') ||
        room.room_name.includes('Large') ||
        room.room_name.includes('Protected') ||
        room.room_name.includes('Transferable') ||
        room.room_name.includes('Source') ||
        room.room_name.includes('Target') ||
        room.room_name.includes('Linked') ||
        room.room_name.includes('Room')
      );

      for (const room of testRooms) {
        try {
          await this.deleteRoom(room.id);
        } catch (error) {
          // Ignore errors during cleanup
          console.warn(`Failed to cleanup room ${room.room_name}:`, error);
        }
      }
    }
  }

  /**
   * Delete all rooms for a specific location
   */
  async deleteAllRoomsForLocation(locationName: string): Promise<void> {
    const rooms = await this.getRoomsByLocationName(locationName);
    for (const room of rooms) {
      try {
        await this.deleteRoom(room.id);
      } catch (error) {
        console.warn(`Failed to delete room ${room.room_name}:`, error);
      }
    }
  }

  /**
   * Verify room exists
   */
  async verifyRoomExists(roomName: string): Promise<boolean> {
    const room = await this.findRoomByName(roomName);
    return room !== undefined;
  }

  /**
   * Verify room does not exist
   */
  async verifyRoomNotExists(roomName: string): Promise<boolean> {
    const room = await this.findRoomByName(roomName);
    return room === undefined;
  }

  /**
   * Get room count
   */
  async getRoomCount(): Promise<number> {
    const response = await this.getRooms();
    return response.success && response.rooms ? response.rooms.length : 0;
  }

  /**
   * Get room count for location
   */
  async getRoomCountForLocation(locationName: string): Promise<number> {
    const rooms = await this.getRoomsByLocationName(locationName);
    return rooms.length;
  }
}
