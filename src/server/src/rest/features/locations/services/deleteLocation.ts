import { dbRun, dbGet } from '../../../utils/database';
import { LocationResponse } from '../types/LocationResponse';
import { Location } from '../types/Location';

export const deleteLocation = async (locationId: string): Promise<LocationResponse> => {
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

    // Check if location exists
    const existingLocation = await dbGet(
      'SELECT * FROM locations WHERE id = ?',
      [locationId]
    ) as Location;

    if (!existingLocation) {
      response.errors?.push('Location not found');
      response.message = 'Location with specified ID does not exist';
      return response;
    }

    // Check if location has associated rooms
    const hasRooms = await dbGet(
      'SELECT COUNT(*) as count FROM rooms WHERE location_id = ?',
      [locationId]
    );

    if (hasRooms && hasRooms.count > 0) {
      response.errors?.push('Cannot delete location with existing rooms');
      response.message = 'Location has associated rooms and cannot be deleted';
      return response;
    }

    // Delete location from database
    const result = await dbRun(
      'DELETE FROM locations WHERE id = ?',
      [locationId]
    );

    if (result.changes === 0) {
      response.errors?.push('Location not found');
      response.message = 'Location with specified ID does not exist';
      return response;
    }

    response.success = true;
    response.message = 'Location deleted successfully';
    response.location = existingLocation;

    return response;
  } catch (error) {
    response.errors?.push(`Failed to delete location: ${error}`);
    response.message = `Database error: ${error}`;
    console.error('Error deleting location:', error);
    return response;
  }
};
