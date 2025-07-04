import { activityTemplateApi } from "../steps/controllerSetups";
import { BaseController } from "./baseController";
import { ActivityFilter, ActivityResponse, Activity } from "@local/server";

export class ActivityController extends BaseController {
  constructor(
    baseUrl: string,
    apiKey: string,
    headers: Record<string, string> = {}
  ) {
    super(baseUrl, apiKey, headers);
  }

  async getActivities(filter: ActivityFilter): Promise<ActivityResponse> {
    const queryParams = new URLSearchParams();
    if (filter.id) queryParams.append('id', filter.id);
    if (filter.doctor_id) queryParams.append('doctor_id', filter.doctor_id);
    if (filter.room_id) queryParams.append('room_id', filter.room_id);
    if (filter.start_date) queryParams.append('start_date', filter.start_date);
    if (filter.end_date) queryParams.append('end_date', filter.end_date);   
    if (filter.activity_type) queryParams.append('activity_type', filter.activity_type);
    if( filter.is_template_generated !== undefined) {
      queryParams.append('is_template_generated', filter.is_template_generated.toString());
    }
    if (filter.generation_month) queryParams.append('generation_month', filter.generation_month);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    return this.fetchJson<ActivityResponse>(`/activities${queryString}`, {
      method: "GET",
    });
  }

  async deleteActivity(filter: ActivityFilter): Promise<ActivityResponse> {
    const queryParams = new URLSearchParams();
    if (filter.id) queryParams.append('id', filter.id);
    if (filter.doctor_id) queryParams.append('doctor_id', filter.doctor_id);
    if (filter.room_id) queryParams.append('room_id', filter.room_id);
    if (filter.start_date) queryParams.append('start_date', filter.start_date);
    if (filter.end_date) queryParams.append('end_date', filter.end_date);   
    if (filter.activity_type) queryParams.append('activity_type', filter.activity_type);
    if( filter.is_template_generated !== undefined) {
      queryParams.append('is_template_generated', filter.is_template_generated.toString());
    }
    if (filter.generation_month) queryParams.append('generation_month', filter.generation_month);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    return this.fetchJson<ActivityResponse>(`/activities${queryString}`, {
      method: "DELETE",
    });
  }

  async cleanupTestActivities(): Promise<void> {
    try {
      // 1. Get all templates and find 'Morning Checkup'
      const templateResponse = await activityTemplateApi.getActivityTemplates();;
      if (!templateResponse.success || !templateResponse.templates) return;
      const morningCheckup = templateResponse.templates.find((t) => t.template_name === 'Morning Checkup');
      if (!morningCheckup) return;
      // 2. Get all activities and filter by template_id
      const response = await this.getActivities({});
      if (response.success && response.activities) {
        const toDelete = response.activities.filter((activity: Activity) => activity.template_id === morningCheckup.id);
        for (const activity of toDelete) {
          await this.deleteActivity({id: activity.id});
        }
      }
    } catch (error) {
      console.warn('Activity cleanup error:', error);
    }
  }
}
