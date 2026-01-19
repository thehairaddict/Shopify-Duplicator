import axios from 'axios';
import { Logger } from '../../utils/logger.js';
import { ProgressTracker } from '../../utils/progress.js';
import { query } from '../../database/db.js';

export class MediaMigrator {
  constructor(sourceClient, destinationClient, migrationId, socketManager) {
    this.sourceClient = sourceClient;
    this.destinationClient = destinationClient;
    this.logger = new Logger(migrationId);
    this.progress = new ProgressTracker(migrationId, socketManager);
    this.migrationId = migrationId;
  }

  async migrate() {
    try {
      await this.logger.info('media', 'Starting media migration');

      const filesQuery = `
        query {
          files(first: 250) {
            edges {
              node {
                ... on MediaImage {
                  id
                  image {
                    url
                    originalSrc
                  }
                  alt
                  fileStatus
                }
                ... on GenericFile {
                  id
                  url
                  fileStatus
                }
                ... on Video {
                  id
                  sources {
                    url
                  }
                  fileStatus
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;

      let allFiles = [];
      let hasNextPage = true;
      let cursor = null;

      while (hasNextPage) {
        const query = cursor 
          ? filesQuery.replace('first: 250', `first: 250, after: "${cursor}"`)
          : filesQuery;

        try {
          const response = await this.sourceClient.graphqlRequest(query);
          
          if (response.files && response.files.edges) {
            allFiles = allFiles.concat(response.files.edges.map(edge => edge.node));
            hasNextPage = response.files.pageInfo.hasNextPage;
            cursor = response.files.pageInfo.endCursor;
          } else {
            hasNextPage = false;
          }
        } catch (error) {
          await this.logger.warning('media', 'GraphQL query failed, trying REST API fallback', {
            error: error.message
          });
          hasNextPage = false;
        }
      }

      const totalFiles = allFiles.length;
      await this.progress.setTotal('media', totalFiles);
      await this.logger.info('media', `Found ${totalFiles} media files to migrate`);

      let processedFiles = 0;

      for (const file of allFiles) {
        try {
          const fileId = file.id.split('/').pop();
          
          const existingItem = await query(
            `SELECT destination_id FROM migration_items 
             WHERE migration_id = $1 AND module = 'media' AND source_id = $2`,
            [this.migrationId, fileId]
          );

          if (existingItem.rows.length > 0 && existingItem.rows[0].destination_id) {
            processedFiles++;
            continue;
          }

          let fileUrl = null;
          if (file.image?.originalSrc) {
            fileUrl = file.image.originalSrc;
          } else if (file.url) {
            fileUrl = file.url;
          } else if (file.sources && file.sources.length > 0) {
            fileUrl = file.sources[0].url;
          }

          if (!fileUrl) {
            await this.logger.warning('media', `No URL found for file: ${fileId}`);
            processedFiles++;
            continue;
          }

          const fileResponse = await axios.get(fileUrl, { 
            responseType: 'arraybuffer',
            timeout: 30000
          });

          const fileName = fileUrl.split('/').pop().split('?')[0];
          const base64Data = Buffer.from(fileResponse.data).toString('base64');

          const uploadMutation = `
            mutation fileCreate($files: [FileCreateInput!]!) {
              fileCreate(files: $files) {
                files {
                  id
                  alt
                  createdAt
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `;

          const variables = {
            files: [{
              alt: file.alt || fileName,
              contentType: fileResponse.headers['content-type'] || 'image/jpeg',
              originalSource: fileUrl
            }]
          };

          const uploadResult = await this.destinationClient.graphqlRequest(uploadMutation, variables);

          if (uploadResult.fileCreate?.files?.length > 0) {
            const newFileId = uploadResult.fileCreate.files[0].id.split('/').pop();
            
            await query(
              `INSERT INTO migration_items (migration_id, module, source_id, destination_id, status)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (migration_id, module, source_id) 
               DO UPDATE SET destination_id = $4, status = $5`,
              [this.migrationId, 'media', fileId, newFileId, 'completed']
            );
          }

          processedFiles++;
          await this.progress.updateProgress('media', processedFiles, totalFiles);

          if (processedFiles % 10 === 0) {
            await this.logger.info('media', `Migrated ${processedFiles}/${totalFiles} files`);
          }
        } catch (error) {
          await this.logger.error('media', `Failed to migrate file`, {
            error: error.message,
            fileId: file.id
          });
          processedFiles++;
        }
      }

      await this.logger.success('media', 'Media migration completed', {
        total: totalFiles,
        processed: processedFiles
      });

      return {
        success: true,
        total: totalFiles,
        processed: processedFiles
      };
    } catch (error) {
      await this.logger.error('media', 'Media migration failed', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}
