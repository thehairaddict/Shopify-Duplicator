import express from 'express';
import { pool } from '../database/db.js';
import bcrypt from 'bcrypt';

const router = express.Router();

router.get('/test-login', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM users WHERE email = $1', ['admin@zenithweave.com']);
    const user = result.rows[0];
    
    const isValid = await bcrypt.compare('admin123', user.password);
    
    res.json({
      userFound: !!user,
      userEmail: user?.email,
      passwordValid: isValid,
      userId: user?.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
