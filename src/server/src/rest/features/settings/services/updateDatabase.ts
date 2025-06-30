import { promises as fs } from 'fs';
import path from 'path';
import { dbGet, dbExec } from '../../../utils/database';
import { UpdateResult } from '../types/UpdateResult';
import { SchemaFile } from '../types/SchemaFile';


export const updateDatabase = async (): Promise<UpdateResult> => {
  const result: UpdateResult = {
    success: false,
    message: '',
    currentVersion: 0,
    executedFiles: [],
    errors: []
  };

  try {
    // Get current database version
    const currentVersionRow = await dbGet(
      'SELECT COALESCE(MAX(version), 0) as version FROM database_version'
    ).catch(() => ({ version: 0 }));
    
    const currentVersion = currentVersionRow?.version || 0;
    result.currentVersion = currentVersion;

    // Read schema directory
    const schemaDir = path.join(process.cwd(), '../../','src', 'database', 'schema');
    
    let files: string[];
    try {
      files = await fs.readdir(schemaDir);
    } catch (error) {
      throw new Error(`Cannot read schema directory: ${error}`);
    }

    // Parse and sort schema files by version number
    const schemaFiles: SchemaFile[] = files
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const match = file.match(/^(\d+)_/);
        const version = match ? parseInt(match[1], 10) : 0;
        return {
          filename: file,
          version,
          fullPath: path.join(schemaDir, file)
        };
      })
      .filter(schema => schema.version > 0)
      .sort((a, b) => a.version - b.version);

    if (schemaFiles.length === 0) {
      result.message = 'No schema files found to execute';
      result.success = true;
      return result;
    }

    // Execute each schema file in order
    for (const schemaFile of schemaFiles) {
      try {
        // Read the SQL file
        const sqlContent = await fs.readFile(schemaFile.fullPath, 'utf8');
        let versionExists = (result.currentVersion+1) >= schemaFile.version && result.currentVersion+1 !== 1

        if (versionExists) {
          console.log(`Schema version ${schemaFile.version} already applied, skipping ${schemaFile.filename}`);
          continue;
        }

        await dbExec(sqlContent);

        result.executedFiles.push(schemaFile.filename);
        console.log(`Successfully executed schema file: ${schemaFile.filename}`);

      } catch (error) {
        const errorMsg = `Failed to execute ${schemaFile.filename}: ${error}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
        // Continue with next file rather than failing completely
      }
    }

    // Get final database version
    const finalVersionRow = await dbGet(
      'SELECT COALESCE(MAX(version), 0) as version FROM database_version'
    );
    result.currentVersion = finalVersionRow?.version || 0;

    // Verify database integrity
    try {
      await dbGet('PRAGMA integrity_check');
    } catch (error) {
      result.errors.push(`Database integrity check failed: ${error}`);
    }

    // Determine overall success
    result.success = result.errors.length === 0;
    
    if (result.success) {
      result.message = `Database updated successfully. Current version: ${result.currentVersion}. Executed files: ${result.executedFiles.join(', ')}`;
    } else {
      result.message = `Database update completed with errors. Current version: ${result.currentVersion}. Errors: ${result.errors.join('; ')}`;
    }

    return result;
  } catch (error) {
    result.errors.push(`Database update failed: ${error}`);
    result.message = `Fatal error: ${error}`;
    return result;
  }
};
