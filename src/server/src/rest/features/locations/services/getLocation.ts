import { dbGet } from '../../../utils/database';
import { LocationResponse } from '../types/LocationResponse';
import { Location } from '../types/Location';

export const getLocation = async (locationId: string): Promise<LocationResponse> => {
  const response: LocationResponse = {
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

    // Retrieve location from database
    const location = await dbGet(
      'SELECT * FROM locations WHERE id = ?',
      [locationId]
    ) as Location;

    if (!location) {
      response.errors?.push('Location not found');
      response.message = 'Location with specified ID does not exist';
      return response;
    }

    response.success = true;
    response.message = 'Location retrieved successfully';
    response.location = location;

    return response;
  } catch (error) {
    response.errors?.push(`Failed to retrieve location: ${error}`);
    response.message = `Database error: ${error}`;
    console.error('Error retrieving location:', error);
    return response;
  }
};
