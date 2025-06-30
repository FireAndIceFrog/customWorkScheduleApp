export interface HealthStatus {
    status: string;
    database: {
      connected: boolean;
      version: number;
      integrityCheck: string;
      tableCount: number;
      viewCount: number;
      indexCount: number;
    };
    timestamp: string;
  }
  