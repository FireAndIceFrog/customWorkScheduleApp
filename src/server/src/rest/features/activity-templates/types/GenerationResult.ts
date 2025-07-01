export interface GenerationResult {
  success: boolean;
  message: string;
  generation_month: string;
  total_templates_processed: number;
  total_activities_generated: number;
  total_conflicts_skipped: number;
  errors?: string[];
  activities_generated?: any[];
  conflicts?: any[];
}
