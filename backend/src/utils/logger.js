import { query } from '../database/db.js';

export class Logger {
  constructor(migrationId) {
    this.migrationId = migrationId;
  }

  async log(module, level, message, metadata = {}) {
    try {
      await query(
        `INSERT INTO migration_logs (migration_id, module, level, message, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [this.migrationId, module, level, message, JSON.stringify(metadata)]
      );
      
      console.log(`[${level.toUpperCase()}] [${module}] ${message}`, metadata);
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  async info(module, message, metadata = {}) {
    return this.log(module, 'info', message, metadata);
  }

  async warning(module, message, metadata = {}) {
    return this.log(module, 'warning', message, metadata);
  }

  async error(module, message, metadata = {}) {
    return this.log(module, 'error', message, metadata);
  }

  async success(module, message, metadata = {}) {
    return this.log(module, 'success', message, metadata);
  }
}
