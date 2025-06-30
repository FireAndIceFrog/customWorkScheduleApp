
export interface UpdateResult {
    success: boolean;
    message: string;
    currentVersion: number;
    executedFiles: string[];
    errors: string[];
  }