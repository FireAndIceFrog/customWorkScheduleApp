import { dbRun, dbGet } from '../../../utils/database';
import { UpdateLocationRequest } from '../types/UpdateLocationRequest';
import { LocationResponse } from '../types/LocationResponse';
import { Location } from '../types/Location';

export const updateLocation = async (locationId: string, locationData: UpdateLocationRequest): Promise<LocationResponse> => {
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

    // Check if location_key already exists (if being updated)
    if (locationData.location_key && locationData.location_key !== existingLocation.location_key) {
      const keyExists = await dbGet(
        'SELECT id FROM locations WHERE location_key = ? AND id != ?',
        [locationData.location_key, locationId]
      );
      
      if (keyExists) {
        response.errors?.push('Location key already exists');
        response.message = 'Another location with this key already exists';
        return response;
      }
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (locationData.location_name !== undefined) {
      updateFields.push('location_name = ?');
      updateValues.push(locationData.location_name);
    }

    if (locationData.location_key !== undefined) {
      updateFields.push('location_key = ?');
      updateValues.push(locationData.location_key);
    }

    if (locationData.address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(locationData.address);
    }

    if (updateFields.length === 0) {
      response.errors?.push('No fields to update');
      response.message = 'No valid update fields provided';
      return response;
    }

    // Add updated_at timestamp
    updateFields.push('updated_at = ?');
    updateValues.push(Math.floor(Date.now() / 1000));

    // Add location ID for WHERE clause
    updateValues.push(locationId);

    // Update location in database
    await dbRun(
      `UPDATE locations SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Retrieve the updated location
    const updatedLocation = await dbGet(
      'SELECT * FROM locations WHERE id = ?',
      [locationId]
    ) as Location;

    response.success = true;
    response.message = 'Location updated successfully';
    response.location = updatedLocation;

    return response;
  } catch (error) {
    response.errors?.push(`Failed to update location: ${error}`);
    response.message = `Database error: ${error}`;
    console.error('Error updating location:', error);
    return response;
  }
};
