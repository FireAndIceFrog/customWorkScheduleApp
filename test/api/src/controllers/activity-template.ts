import { BaseController } from "./baseController";
import { ActivityTemplate, TemplateResponse } from "@local/server";

export class ActivityTemplateController extends BaseController {
    constructor(
        baseUrl: string,
        apiKey: string, 
        headers: Record<string, string> = {}
    ) {
        super(baseUrl, apiKey, headers);
    }   

    async createActivityTemplate(templateData: {
        doctor_id: string;
        room_id: string;
        day_of_week: number;
        start_time: string;
        end_time: string;
        template_name?: string;
    }): Promise<TemplateResponse> {
        return this.fetchJson<TemplateResponse>('/activity-templates', {
            method: 'POST',
            body: JSON.stringify(templateData),
        });
    }

    async getActivityTemplates(): Promise<TemplateResponse> {
        return this.fetchJson<TemplateResponse>('/activity-templates');
    }

    async getActivityTemplate(templateId: string): Promise<TemplateResponse> {
        return this.fetchJson<TemplateResponse>(`/activity-templates/${templateId}`);
    }

    async getTemplatesByDoctor(doctorId: string): Promise<TemplateResponse> {
        return this.fetchJson<TemplateResponse>(`/doctors/${doctorId}/activity-templates`);
    }

    async updateActivityTemplate(templateId: string, templateData: {
        doctor_id?: string;
        room_id?: string;
        day_of_week?: number;
        start_time?: string;
        end_time?: string;
        template_name?: string;
        is_active?: number;
    }): Promise<TemplateResponse> {
        return this.fetchJson<TemplateResponse>(`/activity-templates/${templateId}`, {
            method: 'PUT',
            body: JSON.stringify(templateData),
        });
    }

    async deleteActivityTemplate(templateId: string): Promise<TemplateResponse> {
        return this.fetchJson<TemplateResponse>(`/activity-templates/${templateId}`, {
            method: 'DELETE',
        });
    }

    async generateActivities(month: string): Promise<TemplateResponse> {
        return this.fetchJson<TemplateResponse>(`/activity-templates/generate/${month}`, {
            method: 'POST',
        });
    }

    // Helper methods for test operations
    async findTemplateByName(templateName: string): Promise<ActivityTemplate | undefined> {
        const response = await this.getActivityTemplates();
        if (response.success && response.templates) {
            return response.templates.find((template: ActivityTemplate) => 
                template.template_name === templateName
            );
        }
        return undefined;
    }

    async cleanupTestTemplates(): Promise<void> {
        try {
            const response = await this.getActivityTemplates();
            if (response.success && response.templates) {
                for (const template of response.templates) {
                    if (template.template_name && 
                        (template.template_name.includes('Test') || 
                         template.template_name.includes('TEST_') ||
                         template.template_name.includes('Morning Checkup'))) {
                        await this.deleteActivityTemplate(template.id);
                    }
                }
            }
        } catch (error) {
            console.warn('Template cleanup error:', error);
        }
    }
}
