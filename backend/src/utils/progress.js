import { query } from '../database/db.js';

export class ProgressTracker {
  constructor(migrationId, socketManager) {
    this.migrationId = migrationId;
    this.socketManager = socketManager;
  }

  async updateProgress(module, processed, total) {
    try {
      const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;
      
      const result = await query(
        `UPDATE migrations 
         SET progress = jsonb_set(
           progress, 
           $1::text[], 
           $2::jsonb
         ),
         processed_items = jsonb_set(
           processed_items,
           $1::text[],
           $3::jsonb
         ),
         total_items = jsonb_set(
           total_items,
           $1::text[],
           $4::jsonb
         )
         WHERE id = $5
         RETURNING progress, processed_items, total_items`,
        [
          `{${module}}`,
          JSON.stringify(percentage),
          JSON.stringify(processed),
          JSON.stringify(total),
          this.migrationId
        ]
      );

      if (result.rows.length > 0) {
        this.socketManager?.emitProgress(this.migrationId, {
          module,
          percentage,
          processed,
          total,
          allProgress: result.rows[0].progress,
          allProcessed: result.rows[0].processed_items,
          allTotals: result.rows[0].total_items
        });
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  }

  async setTotal(module, total) {
    try {
      await query(
        `UPDATE migrations 
         SET total_items = jsonb_set(
           total_items,
           $1::text[],
           $2::jsonb
         )
         WHERE id = $3`,
        [`{${module}}`, JSON.stringify(total), this.migrationId]
      );
    } catch (error) {
      console.error('Failed to set total:', error);
    }
  }

  async calculateGlobalProgress() {
    try {
      const result = await query(
        `SELECT progress, selected_modules FROM migrations WHERE id = $1`,
        [this.migrationId]
      );

      if (result.rows.length === 0) return 0;

      const { progress, selected_modules } = result.rows[0];
      const selectedModules = Object.keys(selected_modules).filter(
        key => selected_modules[key] === true
      );

      if (selectedModules.length === 0) return 0;

      const totalProgress = selectedModules.reduce((sum, module) => {
        return sum + (progress[module] || 0);
      }, 0);

      return Math.round(totalProgress / selectedModules.length);
    } catch (error) {
      console.error('Failed to calculate global progress:', error);
      return 0;
    }
  }
}
