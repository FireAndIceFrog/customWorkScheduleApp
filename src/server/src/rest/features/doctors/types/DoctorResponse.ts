import { Doctor } from "./Doctor";

export interface DoctorResponse {
  success: boolean;
  message: string;
  doctor?: Doctor;
  doctors?: Doctor[];
  errors?: string[];
}
