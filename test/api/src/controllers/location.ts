import { BaseController } from './baseController';
import { Location, CreateLocationRequest, UpdateLocationRequest, LocationResponse } from '@local/server';

export class LocationController extends BaseController {
  constructor(
    baseUrl: string,
    apiKey: string,
    headers: Record<string, string> = {}
  ) {
    super(baseUrl, apiKey, headers);
  }

  /**
   * Create a new location
   */
  async createLocation(locationData: CreateLocationRequest): Promise<LocationResponse> {
    const response = await this.fetchJson<LocationResponse>('/locations', {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
    return response;
  }

  /**
   * Get all locations
   */
  async getLocations(): Promise<LocationResponse> {
    const response = await this.fetchJson<LocationResponse>('/locations');
    return response;
  }

  /**
   * Get a specific location by ID
   */
  async getLocation(id: string): Promise<LocationResponse> {
    const response = await this.fetchJson<LocationResponse>(`/locations/${id}`);
    return response;
  }

  /**
   * Update a location
   */
  async updateLocation(id: string, updateData: UpdateLocationRequest): Promise<LocationResponse> {
    const response = await this.fetchJson<LocationResponse>(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return response;
  }

  /**
   * Delete a location
   */
  async deleteLocation(id: string): Promise<LocationResponse> {
    const response = await this.fetchJson<LocationResponse>(`/locations/${id}`, {
      method: 'DELETE',
    });
    return response;
  }

  /**
   * Find location by name
   */
  async findLocationByName(locationName: string): Promise<Location | undefined> {
    const response = await this.getLocations();
    if (response.success && response.locations) {
      return response.locations.find(location => location.location_name === locationName);
    }
    return undefined;
  }

  /**
   * Find location by location_key
   */
  async findLocationByKey(locationKey: string): Promise<Location | undefined> {
    const response = await this.getLocations();
    if (response.success && response.locations) {
      return response.locations.find(location => location.location_key === locationKey);
    }
    return undefined;
  }

  /**
   * Delete location by name (for test cleanup)
   */
  async deleteLocationByName(locationName: string): Promise<LocationResponse> {
    const location = await this.findLocationByName(locationName);
    if (location) {
      return await this.deleteLocation(location.id);
    }
    return {
      success: false,
      message: `Location not found: ${locationName}`,
      errors: ['Location not found']
    };
  }

  /**
   * Create location with validation
   */
  async createLocationWithValidation(locationData: Partial<CreateLocationRequest>): Promise<LocationResponse> {
    try {
      const response = await this.createLocation(locationData as CreateLocationRequest);
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
   * Attempt to create location with invalid data (for negative testing)
   */
  async attemptCreateWithoutRequiredFields(): Promise<LocationResponse> {
    return await this.createLocationWithValidation({});
  }

  /**
   * Update location with partial data
   */
  async updateLocationPartial(locationName: string, updateData: Partial<UpdateLocationRequest>): Promise<LocationResponse> {
    const location = await this.findLocationByName(locationName);
    if (location) {
      return await this.updateLocation(location.id, updateData);
    }
    return {
      success: false,
      message: `Location not found: ${locationName}`,
      errors: ['Location not found']
    };
  }

  /**
   * Clean up all test locations (for test cleanup)
   */
  async cleanupTestLocations(): Promise<void> {
    const response = await this.getLocations();
    if (response.success && response.locations) {
      // Only clean up locations with TEST prefix for safety
      const testLocations = response.locations.filter(location => 
        location.location_key.startsWith('TEST_') ||
        location.location_name.includes('Test') ||
        location.location_name.includes('North Shore') ||
        location.location_name.includes('City Central') ||
        location.location_name.includes('Duplicate') ||
        location.location_name.includes('Bulk') ||
        location.location_name.includes('Original') ||
        location.location_name.includes('Protected') ||
        location.location_name.includes('Source') ||
        location.location_name.includes('Target') ||
        location.location_name.includes('Downtown') ||
        location.location_name.includes('Capacity')
      );

      for (const location of testLocations) {
        try {
          await this.deleteLocation(location.id);
        } catch (error) {
          // Ignore errors during cleanup
          console.warn(`Failed to cleanup location ${location.location_name}:`, error);
        }
      }
    }
  }

  /**
   * Verify location exists
   */
  async verifyLocationExists(locationName: string): Promise<boolean> {
    const location = await this.findLocationByName(locationName);
    return location !== undefined;
  }

  /**
   * Verify location does not exist
   */
  async verifyLocationNotExists(locationName: string): Promise<boolean> {
    const location = await this.findLocationByName(locationName);
    return location === undefined;
  }

  /**
   * Get location count
   */
  async getLocationCount(): Promise<number> {
    const response = await this.getLocations();
    return response.success && response.locations ? response.locations.length : 0;
  }
}
