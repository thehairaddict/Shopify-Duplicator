import { Logger } from '../../utils/logger.js';
import { ProgressTracker } from '../../utils/progress.js';
import { query } from '../../database/db.js';

export class ProductMigrator {
  constructor(sourceClient, destinationClient, migrationId, socketManager) {
    this.sourceClient = sourceClient;
    this.destinationClient = destinationClient;
    this.logger = new Logger(migrationId);
    this.progress = new ProgressTracker(migrationId, socketManager);
    this.migrationId = migrationId;
  }

  async migrate() {
    try {
      await this.logger.info('products', 'Starting product migration');

      const productsCount = await this.sourceClient.get('/products/count.json');
      const totalProducts = productsCount.count;
      await this.progress.setTotal('products', totalProducts);
      await this.logger.info('products', `Found ${totalProducts} products to migrate`);

      let processedProducts = 0;
      let page = 1;
      const limit = 50;

      while (processedProducts < totalProducts) {
        const products = await this.sourceClient.get(`/products.json?limit=${limit}&page=${page}`);
        
        if (!products.products || products.products.length === 0) {
          break;
        }

        for (const product of products.products) {
          try {
            const existingItem = await query(
              `SELECT destination_id FROM migration_items 
               WHERE migration_id = $1 AND module = 'products' AND source_id = $2`,
              [this.migrationId, product.id.toString()]
            );

            if (existingItem.rows.length > 0 && existingItem.rows[0].destination_id) {
              await this.logger.info('products', `Product already migrated: ${product.title}`);
              processedProducts++;
              continue;
            }

            const productData = {
              product: {
                title: product.title,
                body_html: product.body_html,
                vendor: product.vendor,
                product_type: product.product_type,
                tags: product.tags,
                status: product.status,
                variants: product.variants.map(v => ({
                  option1: v.option1,
                  option2: v.option2,
                  option3: v.option3,
                  price: v.price,
                  compare_at_price: v.compare_at_price,
                  sku: v.sku,
                  barcode: v.barcode,
                  weight: v.weight,
                  weight_unit: v.weight_unit,
                  inventory_management: v.inventory_management,
                  inventory_policy: v.inventory_policy,
                  requires_shipping: v.requires_shipping,
                  taxable: v.taxable,
                })),
                options: product.options,
                images: product.images.map(img => ({
                  src: img.src,
                  alt: img.alt,
                })),
              }
            };

            const newProduct = await this.destinationClient.post('/products.json', productData);

            if (product.metafields && product.metafields.length > 0) {
              for (const metafield of product.metafields) {
                try {
                  await this.destinationClient.post(
                    `/products/${newProduct.product.id}/metafields.json`,
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
                  await this.logger.warning('products', `Failed to migrate metafield for product: ${product.title}`, {
                    error: error.message
                  });
                }
              }
            }

            await query(
              `INSERT INTO migration_items (migration_id, module, source_id, destination_id, status)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (migration_id, module, source_id) 
               DO UPDATE SET destination_id = $4, status = $5, updated_at = CURRENT_TIMESTAMP`,
              [this.migrationId, 'products', product.id.toString(), newProduct.product.id.toString(), 'completed']
            );

            processedProducts++;
            await this.progress.updateProgress('products', processedProducts, totalProducts);

            if (processedProducts % 10 === 0) {
              await this.logger.info('products', `Migrated ${processedProducts}/${totalProducts} products`);
            }
          } catch (error) {
            await this.logger.error('products', `Failed to migrate product: ${product.title}`, {
              error: error.message,
              productId: product.id
            });

            await query(
              `INSERT INTO migration_items (migration_id, module, source_id, status, error_message, retry_count)
               VALUES ($1, $2, $3, $4, $5, $6)
               ON CONFLICT (migration_id, module, source_id) 
               DO UPDATE SET status = $4, error_message = $5, retry_count = migration_items.retry_count + 1`,
              [this.migrationId, 'products', product.id.toString(), 'failed', error.message, 1]
            );

            processedProducts++;
          }
        }

        page++;
      }

      await this.logger.success('products', 'Product migration completed', {
        total: totalProducts,
        processed: processedProducts
      });

      return {
        success: true,
        total: totalProducts,
        processed: processedProducts
      };
    } catch (error) {
      await this.logger.error('products', 'Product migration failed', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}
