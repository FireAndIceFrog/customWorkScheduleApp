import { uuidv7 } from 'uuidv7';
import { dbRun, dbGet } from '../../../utils/database';
import { CreateLocationRequest } from '../types/CreateLocationRequest';
import { LocationResponse } from '../types/LocationResponse';
import { Location } from '../types/Location';

export const createLocation = async (locationData: CreateLocationRequest): Promise<LocationResponse> => {
  const response: LocationResponse = {
    success: false,
    message: '',
    errors: []
  };

  try {
    // Validate input
    if (!locationData.location_name || !locationData.location_key) {
      response.errors?.push('Location name and location key are required');
      response.message = 'Validation failed';
      return response;
    }

    // Check if location_key already exists
    const existingLocation = await dbGet(
      'SELECT id FROM locations WHERE location_key = ?',
      [locationData.location_key]
    );
    
    if (existingLocation) {
      response.errors?.push('Location key already exists');
      response.message = 'Location with this key already exists';
      return response;
    }

    // Generate UUID and timestamp
    const locationId = uuidv7();
    const currentTime = Math.floor(Date.now() / 1000);

    // Insert location into database
    await dbRun(
      `INSERT INTO locations (id, location_name, location_key, address, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        locationId,
        locationData.location_name,
        locationData.location_key,
        locationData.address || null,
        currentTime,
        currentTime
      ]
    );

    // Retrieve the created location
    const createdLocation = await dbGet(
      'SELECT * FROM locations WHERE id = ?',
      [locationId]
    ) as Location;

    response.success = true;
    response.message = 'Location created successfully';
    response.location = createdLocation;

    return response;
  } catch (error) {
    response.errors?.push(`Failed to create location: ${error}`);
    response.message = `Database error: ${error}`;
    console.error('Error creating location:', error);
    return response;
  }
};
