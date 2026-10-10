import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { query } from '../config/db.js';
import { UnauthorizedError } from '../utils/errors.js';

/**
 * Authentication middleware that verifies JWT bearer tokens / session cookies.
 * Attaches the authenticated user to req.user.
 */
export async function authenticate(req, res, next) {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.headers['x-session-token']) {
      token = req.headers['x-session-token'];
    }

    if (!token) {
      throw new UnauthorizedError('Authentication required. Missing Bearer token.');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired authentication token.');
    }

    // Retrieve active user record
    const userRes = await query(
      `SELECT id, email, full_name, student_id, role, avatar_url, created_at 
       FROM users 
       WHERE id = $1 LIMIT 1;`,
      [decoded.userId || decoded.id]
    );

    if (userRes.rowCount === 0) {
      throw new UnauthorizedError('User account not found or deactivated.');
    }

    req.user = userRes.rows[0];
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional authentication middleware for public endpoints with member-specific perks.
 * Populates req.user if valid token present, otherwise proceeds as guest.
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        const userRes = await query(
          `SELECT id, email, full_name, student_id, role, avatar_url 
           FROM users 
           WHERE id = $1 LIMIT 1;`,
          [decoded.userId || decoded.id]
        );
        if (userRes.rowCount > 0) {
          req.user = userRes.rows[0];
        }
      } catch (e) {
        // Token invalid, proceed anonymously
      }
    }
    next();
  } catch (err) {
    next(err);
  }
}
