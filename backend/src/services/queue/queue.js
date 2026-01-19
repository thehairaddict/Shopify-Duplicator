import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../../config/index.js';

const connection = new IORedis(config.redis.url, {
  maxRetriesPerRequest: null,
});

export const migrationQueue = new Queue('migration', { connection });

export async function addMigrationJob(migrationId, module) {
  return await migrationQueue.add(
    `migrate-${module}`,
    { migrationId, module },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        age: 3600,
        count: 100,
      },
      removeOnFail: {
        age: 86400,
      },
    }
  );
}
