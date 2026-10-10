import { query } from '../config/db.js';
import { ForbiddenError, NotFoundError, BadRequestError } from '../utils/errors.js';

/**
 * Resolves and validates the current club tenant.
 * Sets req.clubId and req.club.
 */
export async function requireClubTenant(req, res, next) {
  try {
    const clubId = req.headers['x-club-id'] || req.params.clubId || req.query.clubId;

    if (!clubId) {
      throw new BadRequestError('Multi-tenant header [x-club-id] or route parameter [clubId] is required.');
    }

    const clubRes = await query(
      `SELECT id, name, slug, logo_url, stripe_account_id, is_active 
       FROM clubs 
       WHERE id = $1 LIMIT 1;`,
      [clubId]
    );

    if (clubRes.rowCount === 0) {
      throw new NotFoundError(`Club organization with ID '${clubId}' does not exist.`);
    }

    const club = clubRes.rows[0];
    if (!club.is_active) {
      throw new ForbiddenError('This club organization is currently deactivated or suspended.');
    }

    req.clubId = club.id;
    req.club = club;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Enforces Role-Based Access Control (RBAC).
 * Checks if req.user has one of the allowed roles.
 * 
 * Supports:
 * - System roles (users.role: 'ADMIN', 'STUDENT')
 * - Club-specific executive roles / membership tiers
 * 
 * @param {string[]} allowedRoles - e.g. ['ADMIN', 'TREASURER', 'PRESIDENT', 'OFFICER']
 */
export function authorizeRole(allowedRoles = []) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Authentication required to verify permissions.');
      }

      const userRole = (req.user.role || '').toUpperCase();

      // Global Super Admin bypasses club-specific role gates
      if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        return next();
      }

      // Check if user's global role matches directly
      const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());
      if (normalizedAllowed.includes(userRole)) {
        return next();
      }

      // If club tenant context exists, check member's specific club permissions
      if (req.clubId) {
        const membershipRes = await query(
          `SELECT tier, status 
           FROM club_memberships 
           WHERE club_id = $1 AND user_id = $2 LIMIT 1;`,
          [req.clubId, req.user.id]
        );

        if (membershipRes.rowCount > 0) {
          const membership = membershipRes.rows[0];
          const memberTier = (membership.tier || '').toUpperCase();
          if (normalizedAllowed.includes(memberTier)) {
            req.membership = membership;
            return next();
          }
        }
      }

      throw new ForbiddenError(
        `Insufficient privileges. Required one of: [${allowedRoles.join(', ')}]. Current role: ${userRole}`
      );
    } catch (err) {
      next(err);
    }
  };
}
