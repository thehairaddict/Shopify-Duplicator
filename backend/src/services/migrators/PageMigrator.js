import { Logger } from '../../utils/logger.js';
import { ProgressTracker } from '../../utils/progress.js';
import { query } from '../../database/db.js';

export class PageMigrator {
  constructor(sourceClient, destinationClient, migrationId, socketManager) {
    this.sourceClient = sourceClient;
    this.destinationClient = destinationClient;
    this.logger = new Logger(migrationId);
    this.progress = new ProgressTracker(migrationId, socketManager);
    this.migrationId = migrationId;
  }

  async migrate() {
    try {
      await this.logger.info('pages', 'Starting page migration');

      const pagesCount = await this.sourceClient.get('/pages/count.json');
      const totalPages = pagesCount.count;
      await this.progress.setTotal('pages', totalPages);
      await this.logger.info('pages', `Found ${totalPages} pages to migrate`);

      let processedPages = 0;
      let page = 1;
      const limit = 250;

      while (processedPages < totalPages) {
        const pages = await this.sourceClient.get(`/pages.json?limit=${limit}&page=${page}`);
        
        if (!pages.pages || pages.pages.length === 0) {
          break;
        }

        for (const pageItem of pages.pages) {
          try {
            const existingItem = await query(
              `SELECT destination_id FROM migration_items 
               WHERE migration_id = $1 AND module = 'pages' AND source_id = $2`,
              [this.migrationId, pageItem.id.toString()]
            );

            if (existingItem.rows.length > 0 && existingItem.rows[0].destination_id) {
              processedPages++;
              continue;
            }

            const pageData = {
              page: {
                title: pageItem.title,
                body_html: pageItem.body_html,
                handle: pageItem.handle,
                published: pageItem.published,
                author: pageItem.author,
                template_suffix: pageItem.template_suffix,
              }
            };

            const newPage = await this.destinationClient.post('/pages.json', pageData);

            if (pageItem.metafields && pageItem.metafields.length > 0) {
              for (const metafield of pageItem.metafields) {
                try {
                  await this.destinationClient.post(
                    `/pages/${newPage.page.id}/metafields.json`,
                    {
                      metafield: {
                        namespace: metafield.namespace,
                        key: metafield.key,
                        value: metafield.value,
                        type: metafield.type,
                      }
                    }
                  );
                } catch (error) {
                  await this.logger.warning('pages', `Failed to migrate metafield for page: ${pageItem.title}`, {
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
              [this.migrationId, 'pages', pageItem.id.toString(), newPage.page.id.toString(), 'completed']
            );

            processedPages++;
            await this.progress.updateProgress('pages', processedPages, totalPages);

            if (processedPages % 10 === 0) {
              await this.logger.info('pages', `Migrated ${processedPages}/${totalPages} pages`);
            }
          } catch (error) {
            await this.logger.error('pages', `Failed to migrate page: ${pageItem.title}`, {
              error: error.message
            });
            processedPages++;
          }
        }

        page++;
      }

      await this.logger.success('pages', 'Page migration completed', {
        total: totalPages,
        processed: processedPages
      });

      return {
        success: true,
        total: totalPages,
        processed: processedPages
      };
    } catch (error) {
      await this.logger.error('pages', 'Page migration failed', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}
