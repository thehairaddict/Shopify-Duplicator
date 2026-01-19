import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { query } from '../database/db.js';

export async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.session?.token;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, config.security.jwtSecret);
    
    const result = await query(
      'SELECT id, email FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.session?.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, config.security.jwtSecret);
      req.user = { id: decoded.userId };
    } catch (error) {
      // Token invalid, but that's okay for optional auth
    }
  }

  next();
}
