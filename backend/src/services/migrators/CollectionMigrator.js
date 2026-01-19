import { Logger } from '../../utils/logger.js';
import { ProgressTracker } from '../../utils/progress.js';
import { query } from '../../database/db.js';

export class CollectionMigrator {
  constructor(sourceClient, destinationClient, migrationId, socketManager) {
    this.sourceClient = sourceClient;
    this.destinationClient = destinationClient;
    this.logger = new Logger(migrationId);
    this.progress = new ProgressTracker(migrationId, socketManager);
    this.migrationId = migrationId;
  }

  async migrate() {
    try {
      await this.logger.info('collections', 'Starting collection migration');

      const customCollections = await this.sourceClient.get('/custom_collections.json');
      const smartCollections = await this.sourceClient.get('/smart_collections.json');
      
      const totalCollections = (customCollections.custom_collections?.length || 0) + 
                               (smartCollections.smart_collections?.length || 0);
      
      await this.progress.setTotal('collections', totalCollections);
      await this.logger.info('collections', `Found ${totalCollections} collections to migrate`);

      let processedCollections = 0;

      for (const collection of customCollections.custom_collections || []) {
        try {
          const existingItem = await query(
            `SELECT destination_id FROM migration_items 
             WHERE migration_id = $1 AND module = 'collections' AND source_id = $2`,
            [this.migrationId, `custom_${collection.id}`]
          );

          if (existingItem.rows.length > 0 && existingItem.rows[0].destination_id) {
            processedCollections++;
            continue;
          }

          const collectionData = {
            custom_collection: {
              title: collection.title,
              body_html: collection.body_html,
              handle: collection.handle,
              published: collection.published,
              sort_order: collection.sort_order,
            }
          };

          if (collection.image) {
            collectionData.custom_collection.image = {
              src: collection.image.src,
              alt: collection.image.alt,
            };
          }

          const newCollection = await this.destinationClient.post(
            '/custom_collections.json', 
            collectionData
          );

          const collects = await this.sourceClient.get(
            `/collects.json?collection_id=${collection.id}`
          );

          const productMap = await this.getProductMapping();

          for (const collect of collects.collects || []) {
            const destinationProductId = productMap[collect.product_id];
            if (destinationProductId) {
              try {
                await this.destinationClient.post('/collects.json', {
                  collect: {
                    product_id: destinationProductId,
                    collection_id: newCollection.custom_collection.id,
                  }
                });
              } catch (error) {
                await this.logger.warning('collections', `Failed to add product to collection`, {
                  error: error.message
                });
              }
            }
          }

          await query(
            `INSERT INTO migration_items (migration_id, module, source_id, destination_id, status)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (migration_id, module, source_id) 
             DO UPDATE SET destination_id = $4, status = $5`,
            [this.migrationId, 'collections', `custom_${collection.id}`, 
             newCollection.custom_collection.id.toString(), 'completed']
          );

          processedCollections++;
          await this.progress.updateProgress('collections', processedCollections, totalCollections);
        } catch (error) {
          await this.logger.error('collections', `Failed to migrate custom collection: ${collection.title}`, {
            error: error.message
          });
          processedCollections++;
        }
      }

      for (const collection of smartCollections.smart_collections || []) {
        try {
          const existingItem = await query(
            `SELECT destination_id FROM migration_items 
             WHERE migration_id = $1 AND module = 'collections' AND source_id = $2`,
            [this.migrationId, `smart_${collection.id}`]
          );

          if (existingItem.rows.length > 0 && existingItem.rows[0].destination_id) {
            processedCollections++;
            continue;
          }

          const collectionData = {
            smart_collection: {
              title: collection.title,
              body_html: collection.body_html,
              handle: collection.handle,
              published: collection.published,
              rules: collection.rules,
              disjunctive: collection.disjunctive,
              sort_order: collection.sort_order,
            }
          };

          if (collection.image) {
            collectionData.smart_collection.image = {
              src: collection.image.src,
              alt: collection.image.alt,
            };
          }

          const newCollection = await this.destinationClient.post(
            '/smart_collections.json', 
            collectionData
          );

          await query(
            `INSERT INTO migration_items (migration_id, module, source_id, destination_id, status)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (migration_id, module, source_id) 
             DO UPDATE SET destination_id = $4, status = $5`,
            [this.migrationId, 'collections', `smart_${collection.id}`, 
             newCollection.smart_collection.id.toString(), 'completed']
          );

          processedCollections++;
          await this.progress.updateProgress('collections', processedCollections, totalCollections);
        } catch (error) {
          await this.logger.error('collections', `Failed to migrate smart collection: ${collection.title}`, {
            error: error.message
          });
          processedCollections++;
        }
      }

      await this.logger.success('collections', 'Collection migration completed', {
        total: totalCollections,
        processed: processedCollections
      });

      return {
        success: true,
        total: totalCollections,
        processed: processedCollections
      };
    } catch (error) {
      await this.logger.error('collections', 'Collection migration failed', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async getProductMapping() {
    const result = await query(
      `SELECT source_id, destination_id FROM migration_items 
       WHERE migration_id = $1 AND module = 'products' AND status = 'completed'`,
      [this.migrationId]
    );

    const mapping = {};
    for (const row of result.rows) {
      mapping[row.source_id] = row.destination_id;
    }
    return mapping;
  }
}
