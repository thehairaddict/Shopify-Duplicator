import express from 'express';
import { body } from 'express-validator';
import { query } from '../database/db.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { validate } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import { ShopifyClient } from '../services/shopify/client.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, store_url, store_type, created_at FROM stores WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json({ stores: result.rows });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

router.post('/',
  authenticate,
  body('name').notEmpty().trim(),
  body('storeUrl').notEmpty().trim(),
  body('apiKey').notEmpty(),
  body('apiSecret').notEmpty(),
  body('accessToken').notEmpty(),
  body('storeType').isIn(['source', 'destination']),
  validate,
  async (req, res) => {
    try {
      const { name, storeUrl, apiKey, apiSecret, accessToken, storeType } = req.body;

      const normalizedUrl = storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

      const encryptedApiKey = encrypt(apiKey);
      const encryptedApiSecret = encrypt(apiSecret);
      const encryptedAccessToken = encrypt(accessToken);

      const result = await query(
        `INSERT INTO stores (user_id, name, store_url, api_key, api_secret, access_token, store_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, store_url, store_type, created_at`,
        [req.user.id, name, normalizedUrl, encryptedApiKey, encryptedApiSecret, encryptedAccessToken, storeType]
      );

      res.status(201).json({ store: result.rows[0] });
    } catch (error) {
      console.error('Create store error:', error);
      res.status(500).json({ error: 'Failed to create store' });
    }
  }
);

router.put('/:id',
  authenticate,
  body('name').optional().notEmpty().trim(),
  body('storeUrl').optional().notEmpty().trim(),
  body('apiKey').optional().notEmpty(),
  body('apiSecret').optional().notEmpty(),
  body('accessToken').optional().notEmpty(),
  body('storeType').optional().isIn(['source', 'destination']),
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const storeCheck = await query(
        'SELECT id FROM stores WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      if (storeCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Store not found' });
      }

      const fields = [];
      const values = [];
      let paramCount = 1;

      if (updates.name) {
        fields.push(`name = $${paramCount++}`);
        values.push(updates.name);
      }
      if (updates.storeUrl) {
        fields.push(`store_url = $${paramCount++}`);
        values.push(updates.storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''));
      }
      if (updates.apiKey) {
        fields.push(`api_key = $${paramCount++}`);
        values.push(encrypt(updates.apiKey));
      }
      if (updates.apiSecret) {
        fields.push(`api_secret = $${paramCount++}`);
        values.push(encrypt(updates.apiSecret));
      }
      if (updates.accessToken) {
        fields.push(`access_token = $${paramCount++}`);
        values.push(encrypt(updates.accessToken));
      }
      if (updates.storeType) {
        fields.push(`store_type = $${paramCount++}`);
        values.push(updates.storeType);
      }

      if (fields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.user.id);

      const result = await query(
        `UPDATE stores SET ${fields.join(', ')} 
         WHERE id = $${paramCount++} AND user_id = $${paramCount++}
         RETURNING id, name, store_url, store_type, created_at`,
        values
      );

      res.json({ store: result.rows[0] });
    } catch (error) {
      console.error('Update store error:', error);
      res.status(500).json({ error: 'Failed to update store' });
    }
  }
);

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM stores WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }

    res.json({ message: 'Store deleted successfully' });
  } catch (error) {
    console.error('Delete store error:', error);
    res.status(500).json({ error: 'Failed to delete store' });
  }
});

router.post('/:id/test', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT store_url, api_key, api_secret, access_token FROM stores WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const store = result.rows[0];
    const client = new ShopifyClient(
      store.store_url,
      decrypt(store.access_token),
      decrypt(store.api_key),
      decrypt(store.api_secret)
    );

    const testResult = await client.testConnection();

    if (testResult.success) {
      res.json({ success: true, message: 'Connection successful' });
    } else {
      res.status(400).json({ success: false, error: testResult.error });
    }
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
