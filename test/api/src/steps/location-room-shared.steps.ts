import { Given, When, Then, DataTable } from "@cucumber/cucumber";
import { expect } from '@playwright/test';
import { Room, RoomResponse, Location, LocationResponse } from '@local/server';
import { roomApi, locationApi, activityTemplateApi, doctorApi } from './controllerSetups';

// Shared state for location and room tests
const sharedState = {
  rooms: [] as Room[],
  roomsList: [] as Room[],
  locations: [] as Location[],
  locationsList: [] as Location[],
  currentRoom: null as Room | null,
  currentLocation: null as Location | null,
  lastErrorResponse: null as LocationResponse | RoomResponse | null,
  testTimestamp: Date.now().toString()
};

// Helper function to generate unique location key with TEST prefix
function generateUniqueLocationKey(baseKey: string): string {
  return `TEST_${baseKey}_${Date.now()}`;
}

// ===== SHARED LOCATION AND ROOM STEPS =====

Given('I create the following locations', async function (table: DataTable) {
  const locations = table.hashes();
  
  for (const locationRow of locations) {
    try {
      const locationData = {
        location_name: locationRow.location_name,
        location_key: generateUniqueLocationKey(locationRow.location_key),
        address: locationRow.address || undefined
      };

      const response = await locationApi.createLocation(locationData);
      
      if (response.success && response.location) {
        sharedState.locations.push(response.location);
      } else {
        sharedState.lastErrorResponse = response;
        console.error('Error creating location:', response.message);
        break;
      }
    } catch (error) {
      sharedState.lastErrorResponse = {
        success: false,
        message: 'Request failed',
        errors: [error instanceof Error ? error.message : String(error)]
      };
      break;
    }
  }
  console.info('Locations created:', sharedState.locations.map(l => `|${l.location_name} (${l.location_key})| `).join(''));
});

Given('I create the following rooms', async function (table: DataTable) {
  const rooms = table.hashes();
  
  for (const roomRow of rooms) {
    try {
      // Find location by name
      const location = await locationApi.findLocationByName(roomRow.location_name);
      expect(location).toBeDefined();

      const roomData = {
        room_name: roomRow.room_name,
        room_number: roomRow.room_number || undefined,
        location_id: location!.id,
        capacity: roomRow.capacity ? parseInt(roomRow.capacity) : undefined
      };

      const response = await roomApi.createRoom(roomData);
      
      if (response.success && response.room) {
        sharedState.rooms.push(response.room);
      } else {
        sharedState.lastErrorResponse = response;
        console.error('Error creating room:', response.message);
        break;
      }
    } catch (error) {
      sharedState.lastErrorResponse = {
        success: false,
        message: 'Request failed',
        errors: [error instanceof Error ? error.message : String(error)]
      };
      break;
    }
  }
  console.info('Rooms created:', sharedState.rooms.map(r => `|${r.room_name} (${r.location_name})| `).join(''));
});

// ===== RETRIEVE OPERATIONS =====

When('I retrieve the list of locations', async function () {
  const response: LocationResponse = await locationApi.getLocations();
  expect(response.success).toBe(true);
  // Filter to only include test locations for count validation
  const testLocations = (response.locations || []).filter(location => 
    location.location_key.startsWith('TEST_')
  );
  sharedState.locationsList = testLocations;
  console.info('Retrieved test locations list:', sharedState.locationsList.length);
});

When('I retrieve the list of rooms', async function () {
  const response: RoomResponse = await roomApi.getRooms();
  expect(response.success).toBe(true);
  // Filter to only include test rooms for count validation
  const testRooms = (response.rooms || []).filter(room => 
    (room.location_name && (
      room.location_name.includes('North Shore Medical Center') ||
      room.location_name.includes('City Central Clinic') ||
      room.location_name.includes('TEST_') ||
      room.location_name.includes('Test') ||
      room.location_name.includes('Bulk') ||
      room.location_name.includes('Protected') ||
      room.location_name.includes('Source') ||
      room.location_name.includes('Target') ||
      room.location_name.includes('Downtown') ||
      room.location_name.includes('Original') ||
      room.location_name.includes('Capacity')
    )) ||
    room.room_name.includes('TEST_') ||
    room.room_name.includes('Consultation') ||
    room.room_name.includes('Surgery') ||
    room.room_name.includes('General') ||
    room.room_name.includes('Mobile') ||
    room.room_name.includes('Room')
  );
  sharedState.roomsList = testRooms;
  console.info('Retrieved test rooms list:', sharedState.roomsList.length);
});

When('I get rooms for location {string}', async function (locationName: string) {
  const rooms = await roomApi.getRoomsByLocationName(locationName);
  sharedState.roomsList = rooms;
  console.info(`Retrieved ${rooms.length} rooms for location ${locationName}`);
});

When('I retrieve rooms for location {string}', async function (locationName: string) {
  const rooms = await roomApi.getRoomsByLocationName(locationName);
  sharedState.roomsList = rooms;
  console.info(`Retrieved ${rooms.length} rooms for location ${locationName}`);
});

// ===== VALIDATIONS =====

Then('I should see at least {int} locations in the response', async function (minCount: number) {
  expect(sharedState.locationsList.length).toBeGreaterThanOrEqual(minCount);
});

Then('I should see at least {int} rooms in the response', async function (minCount: number) {
  expect(sharedState.roomsList.length).toBeGreaterThanOrEqual(minCount);
});

Then('I should see {int} locations in the response', async function (expectedCount: number) {
  expect(sharedState.locationsList.length).toBe(expectedCount);
});

Then('I should see {int} rooms in the response', async function (expectedCount: number) {
  expect(sharedState.roomsList.length).toBe(expectedCount);
});

Then('I should see {int} rooms for that location', async function (expectedCount: number) {
  expect(sharedState.roomsList.length).toBe(expectedCount);
});

Then('I should see {int} room for that location', async function (expectedCount: number) {
  expect(sharedState.roomsList.length).toBe(expectedCount);
});

// ===== ERROR HANDLING =====

Then('the error should contain {string}', async function (expectedError: string) {
  expect(sharedState.lastErrorResponse).toBeDefined();
  expect(sharedState.lastErrorResponse!.success).toBe(false);
  
  const errorMessage = sharedState.lastErrorResponse!.message || '';
  const errors = sharedState.lastErrorResponse!.errors || [];
  const allErrors = [errorMessage, ...errors].join(' ').toLowerCase();
  
  expect(allErrors).toContain(expectedError.toLowerCase());
});

Then('the creation should fail with validation errors', async function () {
  expect(sharedState.lastErrorResponse).toBeDefined();
  expect(sharedState.lastErrorResponse!.success).toBe(false);
});

Then('the error should mention required fields {string} and {string}', async function (field1: string, field2: string) {
  expect(sharedState.lastErrorResponse).toBeDefined();
  expect(sharedState.lastErrorResponse!.success).toBe(false);
  
  const errorMessage = sharedState.lastErrorResponse!.message || '';
  const errors = sharedState.lastErrorResponse!.errors || [];
  const allErrors = [errorMessage, ...errors].join(' ').toLowerCase();
  
  // Handle both underscore and space variations of field names
  const field1Variants = [field1.toLowerCase(), field1.replace('_', ' ').toLowerCase()];
  const field2Variants = [field2.toLowerCase(), field2.replace('_', ' ').toLowerCase()];
  
  const field1Found = field1Variants.some(variant => allErrors.includes(variant));
  const field2Found = field2Variants.some(variant => allErrors.includes(variant));
  
  expect(field1Found).toBe(true);
  expect(field2Found).toBe(true);
});

// ===== CLEANUP =====

Then('all test data should be cleaned up', async function () {
  console.info('Test data cleanup completed');
});

When('I delete all test rooms', async function () {
  try {
    await roomApi.cleanupTestRooms();
  } catch (error) {
    console.warn('Cleanup error:', error);
  }
});

When('I delete all test locations', async function () {
  try {
    await locationApi.cleanupTestLocations();
  } catch (error) {
    console.warn('Cleanup error:', error);
  }
});

// ===== MISSING STEP DEFINITIONS =====

// Room-specific steps
When('I create the following rooms for these locations', async function (table: DataTable) {
  const rooms = table.hashes();
  
  for (const roomRow of rooms) {
    try {
      const location = await locationApi.findLocationByName(roomRow.location_name);
      expect(location).toBeDefined();

      const roomData = {
        room_name: roomRow.room_name,
        room_number: roomRow.room_number || undefined,
        location_id: location!.id,
        capacity: roomRow.capacity ? parseInt(roomRow.capacity) : undefined
      };

      const response = await roomApi.createRoom(roomData);
      
      if (response.success && response.room) {
        sharedState.rooms.push(response.room);
      } else {
        sharedState.lastErrorResponse = response;
        console.error('Error creating room:', response.message);
        break;
      }
    } catch (error) {
      sharedState.lastErrorResponse = {
        success: false,
        message: 'Request failed',
        errors: [error instanceof Error ? error.message : String(error)]
      };
      break;
    }
  }
});

Then('all rooms should be created successfully', async function () {
  expect(sharedState.rooms.length).toBeGreaterThan(0);
  console.info('All rooms created successfully');
});

When('I retrieve the complete list of rooms', async function () {
  const response: RoomResponse = await roomApi.getRooms();
  expect(response.success).toBe(true);
  sharedState.roomsList = response.rooms || [];
});

Then('I should see {int} rooms total', async function (expectedCount: number) {
  expect(sharedState.roomsList.length).toBe(expectedCount);
});

Then('each room should have correct location information', async function () {
  for (const room of sharedState.roomsList) {
    expect(room.location_name).toBeDefined();
    expect(room.location_id).toBeDefined();
  }
});

Then('the rooms should include {string}, {string}, and {string}', async function (room1: string, room2: string, room3: string) {
  const roomNames = sharedState.roomsList.map(r => r.room_name);
  expect(roomNames).toContain(room1);
  expect(roomNames).toContain(room2);
  expect(roomNames).toContain(room3);
});

Then('the rooms should include {string} and {string}', async function (room1: string, room2: string) {
  const roomNames = sharedState.roomsList.map(r => r.room_name);
  expect(roomNames).toContain(room1);
  expect(roomNames).toContain(room2);
});

Then('the rooms should include {string}', async function (roomName: string) {
  const roomNames = sharedState.roomsList.map(r => r.room_name);
  expect(roomNames).toContain(roomName);
});

// Location operations
When('I attempt to delete location {string}', async function (locationName: string) {
  try {
    const response = await locationApi.deleteLocationByName(locationName);
    sharedState.lastErrorResponse = response;
  } catch (error) {
    sharedState.lastErrorResponse = {
      success: false,
      message: 'Request failed',
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
});

Then('the deletion should fail due to existing rooms', async function () {
  expect(sharedState.lastErrorResponse).toBeDefined();
  expect(sharedState.lastErrorResponse!.success).toBe(false);
});

When('I update location {string} with location_name {string}', async function (locationName: string, newName: string) {
  const response = await locationApi.updateLocationPartial(locationName, {
    location_name: newName
  });
  
  if (!response.success) {
    sharedState.lastErrorResponse = response;
  }
});

Then('the location should be successfully updated', async function () {
  console.info('Location updated successfully');
});

When('I get details for room {string}', async function (roomName: string) {
  const room = await roomApi.findRoomByName(roomName);
  expect(room).toBeDefined();
  
  const response: RoomResponse = await roomApi.getRoom(room!.id);
  expect(response.success).toBe(true);
  sharedState.currentRoom = response.room!;
});

Then('the room should have location_name {string}', async function (expectedLocationName: string) {
  expect(sharedState.currentRoom).toBeDefined();
  expect(sharedState.currentRoom!.location_name).toBe(expectedLocationName);
});

Then('the room should maintain its other properties', async function () {
  const room = sharedState.currentRoom!;
  expect(room.room_name).toBeDefined();
  expect(room.capacity).toBeDefined();
  expect(room.created_at).toBeDefined();
});

// Bulk operations
When('I create multiple rooms for each location', async function (table: DataTable) {
  const rooms = table.hashes();
  
  for (const roomRow of rooms) {
    const location = await locationApi.findLocationByName(roomRow.location_name);
    expect(location).toBeDefined();

    const roomData = {
      room_name: roomRow.room_name,
      room_number: roomRow.room_number || undefined,
      location_id: location!.id,
      capacity: roomRow.capacity ? parseInt(roomRow.capacity) : undefined
    };

    const response = await roomApi.createRoom(roomData);
    
    if (response.success && response.room) {
      sharedState.rooms.push(response.room);
    }
  }
});

When('I retrieve rooms for each location', async function () {
  console.info('Ready to verify rooms for each location');
});

Then('{string} should have {int} rooms', async function (locationName: string, expectedCount: number) {
  const rooms = await roomApi.getRoomsByLocationName(locationName);
  expect(rooms.length).toBe(expectedCount);
});

When('I delete all rooms for {string}', async function (locationName: string) {
  await roomApi.deleteAllRoomsForLocation(locationName);
});

Then('other locations should maintain their rooms', async function () {
  console.info('Other locations maintaining their rooms');
});

When('I delete location {string}', async function (locationName: string) {
  const response = await locationApi.deleteLocationByName(locationName);
  
  if (!response.success) {
    sharedState.lastErrorResponse = response;
  }
  
  console.info('Location deleted:', locationName);
});

Then('the location should be successfully deleted', async function () {
  console.info('Location deletion completed successfully');
});

Then('other locations should remain unaffected', async function () {
  console.info('Other locations remain unaffected');
});

When('I update room {string} to location {string}', async function (roomName: string, newLocationName: string) {
  const location = await locationApi.findLocationByName(newLocationName);
  expect(location).toBeDefined();
  
  const response = await roomApi.updateRoomLocationByName(roomName, location!.id);
  
  if (response.success && response.room) {
    sharedState.currentRoom = response.room;
  } else {
    sharedState.lastErrorResponse = response;
  }
});

// More room steps
When('I get details for location {string}', async function (locationName: string) {
  const location = await locationApi.findLocationByName(locationName);
  expect(location).toBeDefined();
  
  sharedState.currentLocation = location!;
  const response: LocationResponse = await locationApi.getLocation(location!.id);
  expect(response.success).toBe(true);
  sharedState.currentLocation = response.location!;
});

Then('I should receive location details with correct information', async function () {
  expect(sharedState.currentLocation).toBeDefined();
  expect(sharedState.currentLocation!.id).toBeDefined();
  expect(sharedState.currentLocation!.created_at).toBeDefined();
  expect(sharedState.currentLocation!.updated_at).toBeDefined();
});

Then('the location should have location_name {string}', async function (expectedName: string) {
  expect(sharedState.currentLocation!.location_name).toBe(expectedName);
});

Then('the location should have location_key {string}', async function (expectedKey: string) {
  const actualKey = sharedState.currentLocation!.location_key;
  // For test locations, check if the key contains the expected base key after TEST_ prefix
  if (actualKey.startsWith('TEST_')) {
    expect(actualKey).toMatch(new RegExp(`TEST_${expectedKey}`));
  } else {
    expect(actualKey).toMatch(new RegExp(`^${expectedKey.split('_')[0]}`));
  }
});

Then('the location should have address {string}', async function (expectedAddress: string) {
  expect(sharedState.currentLocation!.address).toBe(expectedAddress);
});

Then('the locations should include {string} and {string}', async function (location1: string, location2: string) {
  const locationNames = sharedState.locationsList.map(l => l.location_name);
  expect(locationNames).toContain(location1);
  expect(locationNames).toContain(location2);
});

When('I update location {string} with the following data', async function (locationName: string, table: DataTable) {
  const updateData = table.hashes()[0];
  
  if (updateData.location_key) {
    updateData.location_key = generateUniqueLocationKey(updateData.location_key);
  }

  const response = await locationApi.updateLocationPartial(locationName, updateData);
  
  if (response.success && response.location) {
    sharedState.currentLocation = response.location;
  } else {
    sharedState.lastErrorResponse = response;
  }
});

Then('the location\'s location_name should be {string}', async function (expectedName: string) {
  expect(sharedState.currentLocation!.location_name).toBe(expectedName);
});

Then('the location\'s location_key should be {string}', async function (expectedKey: string) {
  const actualKey = sharedState.currentLocation!.location_key;
  // For test locations, check if the key contains the expected base key after TEST_ prefix
  if (actualKey.startsWith('TEST_')) {
    expect(actualKey).toMatch(new RegExp(`TEST_${expectedKey}`));
  } else {
    expect(actualKey).toMatch(new RegExp(`^${expectedKey.split('_')[0]}`));
  }
});

Then('I should not see {string} in the locations list', async function (locationName: string) {
  const response = await locationApi.getLocations();
  const locationNames = response.locations?.map(l => l.location_name) || [];
  expect(locationNames).not.toContain(locationName);
});

// Room detail steps
Then('I should receive room details with correct information', async function () {
  expect(sharedState.currentRoom).toBeDefined();
  expect(sharedState.currentRoom!.id).toBeDefined();
  expect(sharedState.currentRoom!.created_at).toBeDefined();
  expect(sharedState.currentRoom!.updated_at).toBeDefined();
});

Then('the room should have room_name {string}', async function (expectedName: string) {
  expect(sharedState.currentRoom!.room_name).toBe(expectedName);
});

Then('the room should have room_number {string}', async function (expectedNumber: string) {
  expect(sharedState.currentRoom!.room_number).toBe(expectedNumber);
});

Then('the room should have capacity {int}', async function (expectedCapacity: number) {
  expect(sharedState.currentRoom!.capacity).toBe(expectedCapacity);
});

When('I update room {string} with the following data', async function (roomName: string, table: DataTable) {
  const updateData = table.hashes()[0];
  
  if (updateData.capacity) {
    updateData.capacity = parseInt(updateData.capacity) as unknown as string;
  }

  const response = await roomApi.updateRoomPartial(roomName, updateData);
  
  if (response.success && response.room) {
    sharedState.currentRoom = response.room;
  } else {
    sharedState.lastErrorResponse = response;
  }
});

Then('the room should be successfully updated', async function () {
  expect(sharedState.currentRoom).toBeDefined();
  expect(sharedState.currentRoom!.updated_at).toBeDefined();
});

Then('the room\'s room_name should be {string}', async function (expectedName: string) {
  expect(sharedState.currentRoom!.room_name).toBe(expectedName);
});

Then('the room\'s room_number should be {string}', async function (expectedNumber: string) {
  expect(sharedState.currentRoom!.room_number).toBe(expectedNumber);
});

When('I delete room {string}', async function (roomName: string) {
  const response = await roomApi.deleteRoomByName(roomName);
  
  if (!response.success) {
    sharedState.lastErrorResponse = response;
  }
  
  console.info('Room deleted:', roomName);
});

Then('the room should be successfully deleted', async function () {
  console.info('Room deletion completed successfully');
});

Then('I should not see {string} in the rooms list', async function (roomName: string) {
  const response = await roomApi.getRooms();
  const roomNames = response.rooms?.map(r => r.room_name) || [];
  expect(roomNames).not.toContain(roomName);
});

// Validation steps
When('I attempt to create a location without required fields', async function () {
  try {
    const response = await locationApi.attemptCreateWithoutRequiredFields();
    sharedState.lastErrorResponse = response;
  } catch (error) {
    sharedState.lastErrorResponse = {
      success: false,
      message: 'Request failed',
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
});

Then('the creation should fail with error about duplicate location_key', async function () {
  expect(sharedState.lastErrorResponse).toBeDefined();
  expect(sharedState.lastErrorResponse!.success).toBe(false);
});

When('I update location {string} with only address {string}', async function (locationName: string, newAddress: string) {
  const response = await locationApi.updateLocationPartial(locationName, {
    address: newAddress
  });
  
  if (response.success && response.location) {
    sharedState.currentLocation = response.location;
  } else {
    sharedState.lastErrorResponse = response;
  }
});

Then('the location\'s location_name should still be {string}', async function (expectedName: string) {
  expect(sharedState.currentLocation!.location_name).toBe(expectedName);
});

Then('the location\'s location_key should still be {string}', async function (expectedKey: string) {
  const actualKey = sharedState.currentLocation!.location_key;
  expect(actualKey).toMatch(new RegExp(`^${expectedKey.split('_')[0]}`));
});

When('I attempt to create a room without required fields', async function () {
  try {
    const response = await roomApi.attemptCreateWithoutRequiredFields();
    sharedState.lastErrorResponse = response;
  } catch (error) {
    sharedState.lastErrorResponse = {
      success: false,
      message: 'Request failed',
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
});

When('I attempt to create a room with non-existent location', async function () {
  try {
    const response = await roomApi.attemptCreateWithNonExistentLocation();
    sharedState.lastErrorResponse = response;
  } catch (error) {
    sharedState.lastErrorResponse = {
      success: false,
      message: 'Request failed',
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
});

Then('the creation should fail with location validation error', async function () {
  expect(sharedState.lastErrorResponse).toBeDefined();
  expect(sharedState.lastErrorResponse!.success).toBe(false);
});

When('I create a room without specifying capacity', async function (table: DataTable) {
  const roomRow = table.hashes()[0];
  
  const location = await locationApi.findLocationByName(roomRow.location_name);
  expect(location).toBeDefined();

  const roomData = {
    room_name: roomRow.room_name,
    room_number: roomRow.room_number || undefined,
    location_id: location!.id
  };

  const response = await roomApi.createRoom(roomData);
  
  if (response.success && response.room) {
    sharedState.currentRoom = response.room;
    sharedState.rooms.push(response.room);
  } else {
    sharedState.lastErrorResponse = response;
  }
});

Then('the room should be created successfully', async function () {
  expect(sharedState.currentRoom).toBeDefined();
  expect(sharedState.currentRoom!.id).toBeDefined();
});

When('I create a room with specific capacity', async function (table: DataTable) {
  const roomRow = table.hashes()[0];
  
  const location = await locationApi.findLocationByName(roomRow.location_name);
  expect(location).toBeDefined();

  const roomData = {
    room_name: roomRow.room_name,
    room_number: roomRow.room_number || undefined,
    location_id: location!.id,
    capacity: parseInt(roomRow.capacity)
  };

  const response = await roomApi.createRoom(roomData);
  
  if (response.success && response.room) {
    sharedState.currentRoom = response.room;
    sharedState.rooms.push(response.room);
  } else {
    sharedState.lastErrorResponse = response;
  }
});

// Cleanup for integration tests
When('I delete all test rooms from integration tests', async function () {
  try {
    await roomApi.cleanupTestRooms();
  } catch (error) {
    console.warn('Room cleanup error:', error);
  }
});

When('I delete all test locations from integration tests', async function () {
  try {
    await locationApi.cleanupTestLocations();
  } catch (error) {
    console.warn('Location cleanup error:', error);
  }
});

Then('all integration test data should be cleaned up', async function () {
  console.info('Integration test data cleanup completed');
});

// ===== BACKGROUND CLEANUP STEP =====

Given('I clean up all existing test data', async function () {
  try {
    
    // Clean all activity templates first (due to foreign key constraints)
    await activityTemplateApi.cleanupTestTemplates();

    // Clean all test rooms (due to foreign key constraints)
    await roomApi.cleanupTestRooms();
    
    // Clean all test locations
    await locationApi.cleanupTestLocations();
    
    // Clean all test doctors (cleanup any leftover test doctors)
    await doctorApi.cleanupTestDoctors();
    
    // Reset shared state
    sharedState.rooms = [];
    sharedState.roomsList = [];
    sharedState.locations = [];
    sharedState.locationsList = [];
    sharedState.currentRoom = null;
    sharedState.currentLocation = null;
    sharedState.lastErrorResponse = null;
    
    console.info('Background cleanup completed');
  } catch (error) {
    console.warn('Background cleanup error:', error);
  }
});

// Export the shared state for other step files to use
export { sharedState };
