export interface DoctorResponse {
  success: boolean;
  message: string;
  doctor?: any;
  doctors?: any[];
  errors?: string[];
}
