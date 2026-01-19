import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import { query } from '../database/db.js';
import { config } from '../config/index.js';
import { validate } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const result = await query(
        'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
        [email, passwordHash]
      );

      const user = result.rows[0];
      const token = jwt.sign({ userId: user.id }, config.security.jwtSecret, {
        expiresIn: '7d',
      });

      req.session.token = token;

      res.json({
        user: { id: user.id, email: user.email },
        token,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const result = await query(
        'SELECT id, email, password FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user.id }, config.security.jwtSecret, {
        expiresIn: '7d',
      });

      req.session.token = token;

      res.json({
        user: { id: user.id, email: user.email },
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

router.post('/logout', authenticate, async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

export default router;
