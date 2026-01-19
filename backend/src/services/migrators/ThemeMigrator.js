import axios from 'axios';
import { Logger } from '../../utils/logger.js';
import { ProgressTracker } from '../../utils/progress.js';

export class ThemeMigrator {
  constructor(sourceClient, destinationClient, migrationId, socketManager) {
    this.sourceClient = sourceClient;
    this.destinationClient = destinationClient;
    this.logger = new Logger(migrationId);
    this.progress = new ProgressTracker(migrationId, socketManager);
    this.migrationId = migrationId;
  }

  async migrate() {
    try {
      await this.logger.info('theme', 'Starting theme migration');
      await this.progress.setTotal('theme', 1);

      await this.progress.updateProgress('theme', 0, 1);

      const themes = await this.sourceClient.get('/themes.json');
      const activeTheme = themes.themes.find(t => t.role === 'main');

      if (!activeTheme) {
        throw new Error('No active theme found in source store');
      }

      await this.logger.info('theme', `Found active theme: ${activeTheme.name} (ID: ${activeTheme.id})`);

      const themeAssets = await this.sourceClient.get(`/themes/${activeTheme.id}/assets.json`);
      await this.logger.info('theme', `Found ${themeAssets.assets.length} theme assets`);

      const newTheme = await this.destinationClient.post('/themes.json', {
        theme: {
          name: `${activeTheme.name} (Migrated)`,
          role: 'unpublished',
        }
      });

      const newThemeId = newTheme.theme.id;
      await this.logger.success('theme', `Created new theme with ID: ${newThemeId}`);

      let processedAssets = 0;
      const totalAssets = themeAssets.assets.length;

      for (const asset of themeAssets.assets) {
        try {
          const assetDetail = await this.sourceClient.get(
            `/themes/${activeTheme.id}/assets.json?asset[key]=${encodeURIComponent(asset.key)}`
          );

          const assetData = assetDetail.asset;
          const uploadData = {
            asset: {
              key: assetData.key,
            }
          };

          if (assetData.value !== undefined) {
            uploadData.asset.value = assetData.value;
          } else if (assetData.attachment) {
            uploadData.asset.attachment = assetData.attachment;
          } else if (assetData.src) {
            const response = await axios.get(assetData.src, { responseType: 'arraybuffer' });
            uploadData.asset.attachment = Buffer.from(response.data).toString('base64');
          }

          await this.destinationClient.put(`/themes/${newThemeId}/assets.json`, uploadData);

          processedAssets++;
          const progress = Math.round((processedAssets / totalAssets) * 100);
          await this.progress.updateProgress('theme', progress, 100);

          if (processedAssets % 10 === 0) {
            await this.logger.info('theme', `Migrated ${processedAssets}/${totalAssets} assets`);
          }
        } catch (error) {
          await this.logger.warning('theme', `Failed to migrate asset: ${asset.key}`, {
            error: error.message
          });
        }
      }

      await this.progress.updateProgress('theme', 100, 100);
      await this.logger.success('theme', 'Theme migration completed successfully', {
        themeId: newThemeId,
        themeName: newTheme.theme.name,
        assetsCount: processedAssets
      });

      return {
        success: true,
        themeId: newThemeId,
        themeName: newTheme.theme.name,
        assetsCount: processedAssets
      };
    } catch (error) {
      await this.logger.error('theme', 'Theme migration failed', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}
