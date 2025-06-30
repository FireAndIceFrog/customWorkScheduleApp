import { dbGet } from '../../../utils/database';
import { HealthStatus } from '../types/HealthStatus';

export const health = async (): Promise<HealthStatus> => {
  const result: HealthStatus = {
    status: 'healthy',
    database: {
      connected: false,
      version: 0,
      integrityCheck: 'unknown',
      tableCount: 0,
      viewCount: 0,
      indexCount: 0
    },
    timestamp: new Date().toISOString()
  };

  try {
    // Test database connection
    await dbGet('SELECT 1');
    result.database.connected = true;

    // Get database version
    try {
      const versionRow = await dbGet(
        'SELECT COALESCE(MAX(version), 0) as version FROM database_version'
      );
      result.database.version = versionRow?.version || 0;
    } catch (error) {
      console.warn('Could not retrieve database version:', error);
    }

    // Check database integrity
    try {
      const integrityResult = await dbGet('PRAGMA integrity_check');
      result.database.integrityCheck = integrityResult?.integrity_check || 'ok';
    } catch (error) {
      result.database.integrityCheck = 'failed';
      console.warn('Database integrity check failed:', error);
    }

    // Get database statistics
    try {
      const stats = await dbGet(`
        SELECT 
          (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%') as table_count,
          (SELECT COUNT(*) FROM sqlite_master WHERE type='view') as view_count,
          (SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%') as index_count
      `);
      
      result.database.tableCount = stats?.table_count || 0;
      result.database.viewCount = stats?.view_count || 0;
      result.database.indexCount = stats?.index_count || 0;
    } catch (error) {
      console.warn('Could not retrieve database statistics:', error);
    }

    // Determine overall health status
    if (!result.database.connected) {
      result.status = 'unhealthy';
    } else if (result.database.integrityCheck !== 'ok') {
      result.status = 'degraded';
    } else if (result.database.version === 0) {
      result.status = 'update required';
    } else {
      result.status = 'healthy';
    }
  } catch (error) {
    result.status = 'unhealthy';
    result.database.connected = false;
    console.error('Health check failed:', error);
  }

  return result;
};
