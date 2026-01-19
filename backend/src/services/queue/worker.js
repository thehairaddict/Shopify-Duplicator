import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../../config/index.js';
import { query } from '../../database/db.js';
import { decrypt } from '../../utils/encryption.js';
import { ShopifyClient } from '../shopify/client.js';
import { ThemeMigrator } from '../migrators/ThemeMigrator.js';
import { ProductMigrator } from '../migrators/ProductMigrator.js';
import { CollectionMigrator } from '../migrators/CollectionMigrator.js';
import { PageMigrator } from '../migrators/PageMigrator.js';
import { MediaMigrator } from '../migrators/MediaMigrator.js';

const connection = new IORedis(config.redis.url, {
  maxRetriesPerRequest: null,
});

export function createMigrationWorker(socketManager) {
  const worker = new Worker(
    'migration',
    async (job) => {
      const { migrationId, module } = job.data;

      try {
        await query(
          `UPDATE migrations SET status = 'running', started_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [migrationId]
        );

        const migrationResult = await query(
          `SELECT m.*, 
                  s1.store_url as source_url, s1.access_token as source_token,
                  s1.api_key as source_key, s1.api_secret as source_secret,
                  s2.store_url as dest_url, s2.access_token as dest_token,
                  s2.api_key as dest_key, s2.api_secret as dest_secret
           FROM migrations m
           JOIN stores s1 ON m.source_store_id = s1.id
           JOIN stores s2 ON m.destination_store_id = s2.id
           WHERE m.id = $1`,
          [migrationId]
        );

        if (migrationResult.rows.length === 0) {
          throw new Error('Migration not found');
        }

        const migration = migrationResult.rows[0];

        const sourceClient = new ShopifyClient(
          migration.source_url,
          decrypt(migration.source_token),
          decrypt(migration.source_key),
          decrypt(migration.source_secret)
        );

        const destinationClient = new ShopifyClient(
          migration.dest_url,
          decrypt(migration.dest_token),
          decrypt(migration.dest_key),
          decrypt(migration.dest_secret)
        );

        let migrator;
        switch (module) {
          case 'theme':
            migrator = new ThemeMigrator(sourceClient, destinationClient, migrationId, socketManager);
            break;
          case 'products':
            migrator = new ProductMigrator(sourceClient, destinationClient, migrationId, socketManager);
            break;
          case 'collections':
            migrator = new CollectionMigrator(sourceClient, destinationClient, migrationId, socketManager);
            break;
          case 'pages':
            migrator = new PageMigrator(sourceClient, destinationClient, migrationId, socketManager);
            break;
          case 'media':
            migrator = new MediaMigrator(sourceClient, destinationClient, migrationId, socketManager);
            break;
          default:
            throw new Error(`Unknown module: ${module}`);
        }

        const result = await migrator.migrate();

        const allCompleted = await checkAllModulesCompleted(migrationId);
        if (allCompleted) {
          await query(
            `UPDATE migrations SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [migrationId]
          );
          
          socketManager?.emitMigrationComplete(migrationId);
        }

        return result;
      } catch (error) {
        await query(
          `UPDATE migrations 
           SET status = 'failed', 
               errors = errors || $2::jsonb
           WHERE id = $1`,
          [migrationId, JSON.stringify([{ module, error: error.message, timestamp: new Date() }])]
        );

        throw error;
      }
    },
    {
      connection,
      concurrency: config.queue.concurrency,
    }
  );

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed for module: ${job.data.module}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed for module: ${job.data.module}`, err);
  });

  return worker;
}

async function checkAllModulesCompleted(migrationId) {
  const result = await query(
    `SELECT selected_modules, progress FROM migrations WHERE id = $1`,
    [migrationId]
  );

  if (result.rows.length === 0) return false;

  const { selected_modules, progress } = result.rows[0];
  
  for (const [module, selected] of Object.entries(selected_modules)) {
    if (selected && (!progress[module] || progress[module] < 100)) {
      return false;
    }
  }

  return true;
}
