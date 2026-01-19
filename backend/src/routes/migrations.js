import express from 'express';
import { body } from 'express-validator';
import { query } from '../database/db.js';
import { validate } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import { addMigrationJob } from '../services/queue/queue.js';

const router = express.Router();

router.post('/start',
  authenticate,
  body('sourceStoreId').isInt(),
  body('destinationStoreId').isInt(),
  body('selectedModules').isObject(),
  validate,
  async (req, res) => {
    try {
      const { sourceStoreId, destinationStoreId, selectedModules } = req.body;

      const sourceStore = await query(
        'SELECT id FROM stores WHERE id = $1 AND user_id = $2',
        [sourceStoreId, req.user.id]
      );

      const destStore = await query(
        'SELECT id FROM stores WHERE id = $1 AND user_id = $2',
        [destinationStoreId, req.user.id]
      );

      if (sourceStore.rows.length === 0 || destStore.rows.length === 0) {
        return res.status(404).json({ error: 'Store not found' });
      }

      if (sourceStoreId === destinationStoreId) {
        return res.status(400).json({ error: 'Source and destination stores must be different' });
      }

      const result = await query(
        `INSERT INTO migrations (user_id, source_store_id, destination_store_id, selected_modules, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, status, created_at`,
        [req.user.id, sourceStoreId, destinationStoreId, JSON.stringify(selectedModules), 'pending']
      );

      const migration = result.rows[0];

      for (const [module, selected] of Object.entries(selectedModules)) {
        if (selected) {
          await addMigrationJob(migration.id, module);
        }
      }

      await query(
        'UPDATE migrations SET status = $1 WHERE id = $2',
        ['running', migration.id]
      );

      res.status(201).json({ migration: { ...migration, status: 'running' } });
    } catch (error) {
      console.error('Start migration error:', error);
      res.status(500).json({ error: 'Failed to start migration' });
    }
  }
);

router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT m.*, 
              s1.name as source_store_name,
              s2.name as destination_store_name
       FROM migrations m
       JOIN stores s1 ON m.source_store_id = s1.id
       JOIN stores s2 ON m.destination_store_id = s2.id
       WHERE m.user_id = $1
       ORDER BY m.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    res.json({ migrations: result.rows });
  } catch (error) {
    console.error('Get migrations error:', error);
    res.status(500).json({ error: 'Failed to fetch migrations' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT m.*, 
              s1.name as source_store_name, s1.store_url as source_store_url,
              s2.name as destination_store_name, s2.store_url as destination_store_url
       FROM migrations m
       JOIN stores s1 ON m.source_store_id = s1.id
       JOIN stores s2 ON m.destination_store_id = s2.id
       WHERE m.id = $1 AND m.user_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Migration not found' });
    }

    res.json({ migration: result.rows[0] });
  } catch (error) {
    console.error('Get migration error:', error);
    res.status(500).json({ error: 'Failed to fetch migration' });
  }
});

router.put('/:id/pause', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE migrations SET status = 'paused' 
       WHERE id = $1 AND user_id = $2 AND status = 'running'
       RETURNING id, status`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Migration not found or cannot be paused' });
    }

    res.json({ migration: result.rows[0] });
  } catch (error) {
    console.error('Pause migration error:', error);
    res.status(500).json({ error: 'Failed to pause migration' });
  }
});

router.put('/:id/resume', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const migrationResult = await query(
      `SELECT selected_modules FROM migrations 
       WHERE id = $1 AND user_id = $2 AND status = 'paused'`,
      [id, req.user.id]
    );

    if (migrationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Migration not found or cannot be resumed' });
    }

    const { selected_modules } = migrationResult.rows[0];

    for (const [module, selected] of Object.entries(selected_modules)) {
      if (selected) {
        await addMigrationJob(id, module);
      }
    }

    const result = await query(
      `UPDATE migrations SET status = 'running' WHERE id = $1 RETURNING id, status`,
      [id]
    );

    res.json({ migration: result.rows[0] });
  } catch (error) {
    console.error('Resume migration error:', error);
    res.status(500).json({ error: 'Failed to resume migration' });
  }
});

router.delete('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE migrations SET status = 'cancelled' 
       WHERE id = $1 AND user_id = $2 AND status IN ('pending', 'running', 'paused')
       RETURNING id, status`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Migration not found or cannot be cancelled' });
    }

    res.json({ migration: result.rows[0] });
  } catch (error) {
    console.error('Cancel migration error:', error);
    res.status(500).json({ error: 'Failed to cancel migration' });
  }
});

router.get('/:id/logs', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const migrationCheck = await query(
      'SELECT id FROM migrations WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (migrationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Migration not found' });
    }

    const result = await query(
      `SELECT * FROM migration_logs 
       WHERE migration_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) FROM migration_logs WHERE migration_id = $1',
      [id]
    );

    res.json({
      logs: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

router.get('/:id/export', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const migrationResult = await query(
      `SELECT m.*, 
              s1.name as source_store_name, s1.store_url as source_store_url,
              s2.name as destination_store_name, s2.store_url as destination_store_url
       FROM migrations m
       JOIN stores s1 ON m.source_store_id = s1.id
       JOIN stores s2 ON m.destination_store_id = s2.id
       WHERE m.id = $1 AND m.user_id = $2`,
      [id, req.user.id]
    );

    if (migrationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Migration not found' });
    }

    const migration = migrationResult.rows[0];

    const logsResult = await query(
      'SELECT * FROM migration_logs WHERE migration_id = $1 ORDER BY created_at ASC',
      [id]
    );

    const itemsResult = await query(
      'SELECT module, status, COUNT(*) as count FROM migration_items WHERE migration_id = $1 GROUP BY module, status',
      [id]
    );

    const report = {
      migration: {
        id: migration.id,
        status: migration.status,
        source_store: {
          name: migration.source_store_name,
          url: migration.source_store_url,
        },
        destination_store: {
          name: migration.destination_store_name,
          url: migration.destination_store_url,
        },
        selected_modules: migration.selected_modules,
        progress: migration.progress,
        total_items: migration.total_items,
        processed_items: migration.processed_items,
        started_at: migration.started_at,
        completed_at: migration.completed_at,
        created_at: migration.created_at,
      },
      summary: itemsResult.rows,
      logs: logsResult.rows,
      errors: migration.errors,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=migration-${id}-report.json`);
    res.json(report);
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ error: 'Failed to export report' });
  }
});

export default router;
