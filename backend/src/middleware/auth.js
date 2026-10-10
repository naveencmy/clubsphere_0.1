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

    let userId = null;
    let decoded = null;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET);
      userId = decoded.userId || decoded.id;
    } catch (err) {
      // Check Better Auth database sessions table
      const sessionRes = await query(
        `SELECT user_id FROM sessions WHERE token = $1 AND expires_at > NOW() LIMIT 1;`,
        [token]
      );
      if (sessionRes.rowCount > 0) {
        userId = sessionRes.rows[0].user_id;
      } else {
        throw new UnauthorizedError('Invalid or expired authentication token.');
      }
    }

    // Retrieve active user record with full profile
    const userRes = await query(
      `SELECT u.id, u.name, u.name as full_name, u.email, u.system_role as role, u.image as avatar_url,
              up.student_id_number as student_id, u.created_at, u.updated_at 
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = $1 LIMIT 1;`,
      [userId]
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
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.headers['x-session-token']) {
      token = req.headers['x-session-token'];
    }

    if (token) {
      let userId = null;
      try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        userId = decoded.userId || decoded.id;
      } catch (e) {
        const sessionRes = await query(
          `SELECT user_id FROM sessions WHERE token = $1 AND expires_at > NOW() LIMIT 1;`,
          [token]
        );
        if (sessionRes.rowCount > 0) {
          userId = sessionRes.rows[0].user_id;
        }
      }

      if (userId) {
        const userRes = await query(
          `SELECT u.id, u.name, u.name as full_name, u.email, u.system_role as role, u.image as avatar_url,
                  up.student_id_number as student_id, u.created_at, u.updated_at 
           FROM users u
           LEFT JOIN user_profiles up ON u.id = up.user_id
           WHERE u.id = $1 LIMIT 1;`,
          [userId]
        );
        if (userRes.rowCount > 0) {
          req.user = userRes.rows[0];
        }
      }
    }
    next();
  } catch (err) {
    next(err);
  }
}
