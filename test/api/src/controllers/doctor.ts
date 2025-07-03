import { BaseController } from "./baseController";
import { Doctor, DoctorResponse } from "@local/server";

export class DoctorController extends BaseController {
    constructor(
        baseUrl: string,
        apiKey: string, 
        headers: Record<string, string> = {}
    ) {
        super(baseUrl, apiKey, headers);
    }   

    async getDoctorDetails(doctorId: string): Promise<DoctorResponse> {
        return this.fetchJson<DoctorResponse>(`/doctors/${doctorId}`);
    }

    async listDoctors(): Promise<DoctorResponse> {
        return this.fetchJson<DoctorResponse>(`/doctors`);
    }
    
    async createDoctor(doctorData: {
        first_name: string;
        last_name: string;
        email?: string;
    }): Promise<DoctorResponse> {
        const resp = await this.fetchJson<DoctorResponse>('/doctors', {
            method: 'POST',
            body: JSON.stringify(doctorData),
        });

        return resp;
    }

    async attemptCreateDoctor(doctorData: {
        first_name: string;
        last_name: string;
        email?: string;
    }): Promise<DoctorResponse> {
        return this.fetchJson<DoctorResponse>('/doctors', {
            method: 'POST',
            body: JSON.stringify(doctorData),
        });
    }

    async updateDoctor(doctorId: string, doctorData: {
        first_name?: string;
        last_name?: string;
        email?: string;
    }): Promise<Doctor> {
        const resp = await this.fetchJson<DoctorResponse>(`/doctors/${doctorId}`, {
            method: 'PUT',
            body: JSON.stringify(doctorData),
        });

        if (resp.success){
            return resp.doctor!;
        }

        throw new Error(resp.message);
    }

    async deleteDoctor(doctorId: string): Promise<void> {
        const resp = await this.fetchJson<DoctorResponse>(`/doctors/${doctorId}`, {
            method: 'DELETE',
        });

        if (!resp.success){
            throw new Error(resp.message);
        }
    }

    async cleanupTestDoctors(): Promise<void> {
        try {
            const response = await this.listDoctors();
            if (response.success && response.doctors) {
                for (const doctor of response.doctors) {
                    if (doctor.email && 
                        (doctor.email.includes('test') || 
                        doctor.email.includes('jane') ||
                        doctor.email.includes('jonathan') ||
                        doctor.email.includes('activityTemplateTest') ||
                        doctor.email.includes('duplicate@example.com'))) {
                        try {
                            await this.deleteDoctor(doctor.id);
                        } catch (error) {
                            // Ignore errors during cleanup as some doctors might be referenced
                            console.warn(`Could not delete doctor ${doctor.email}:`, error);
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Doctor cleanup error:', error);
        }
    }
}
