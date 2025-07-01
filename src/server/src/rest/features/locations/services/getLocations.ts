import { dbAll } from '../../../utils/database';
import { LocationResponse } from '../types/LocationResponse';
import { Location } from '../types/Location';

export const getLocations = async (): Promise<LocationResponse> => {
  const response: LocationResponse = {
    success: false,
    message: '',
    errors: []
  };

  try {
    // Retrieve all locations from database
    const locations = await dbAll(
      'SELECT * FROM locations ORDER BY location_name'
    ) as Location[];

    response.success = true;
    response.message = `Retrieved ${locations.length} locations`;
    response.locations = locations;

    return response;
  } catch (error) {
    response.errors?.push(`Failed to retrieve locations: ${error}`);
    response.message = `Database error: ${error}`;
    console.error('Error retrieving locations:', error);
    return response;
  }
};
