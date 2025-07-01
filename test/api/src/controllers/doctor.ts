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

    async getDoctorDetails(doctorId: string) {
        return this.fetchJson(`/doctors/${doctorId}`);
    }

    async listDoctors() {
        return this.fetchJson(`/doctors`);
    }
    
    async createDoctor(doctorData: {
        first_name: string;
        last_name: string;
        email?: string;
    }): Promise<Doctor> {
        const resp = await this.fetchJson<DoctorResponse>('/doctors', {
            method: 'POST',
            body: JSON.stringify(doctorData),
        });

        if (resp.success){
            return resp.doctor!;
        }

        throw new Error(resp.message);
    }
}