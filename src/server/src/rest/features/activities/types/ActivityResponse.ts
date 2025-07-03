import { Activity } from "./Activity";

export interface ActivityResponse {
  success: boolean;
  message: string;
  activity?: Activity;
  activities?: Activity[];
  errors?: string[];
}
