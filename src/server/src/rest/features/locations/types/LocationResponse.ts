import { Location } from './Location';

export interface LocationResponse {
  success: boolean;
  message: string;
  location?: Location;
  locations?: Location[];
  errors?: string[];
}
