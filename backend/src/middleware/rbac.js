import { query } from '../config/db.js';
import { ForbiddenError, NotFoundError, BadRequestError } from '../utils/errors.js';

/**
 * Resolves and validates the current club tenant.
 * Sets req.clubId and req.club.
 */
export async function requireClubTenant(req, res, next) {
  try {
    const clubId = req.headers['x-club-id'] || req.headers['x-club-slug'] || req.params.clubId || req.query.clubId || req.query.clubSlug;

    let clubRes;
    if (clubId) {
      clubRes = await query(
        `SELECT id, name, slug, logo_url, stripe_account_id, is_active 
         FROM clubs 
         WHERE (id::text = $1 OR slug = $1) LIMIT 1;`,
        [clubId]
      );
    } else {
      // Default to primary active club if not explicitly provided
      clubRes = await query(
        `SELECT id, name, slug, logo_url, stripe_account_id, is_active 
         FROM clubs 
         WHERE is_active = TRUE 
         ORDER BY created_at ASC LIMIT 1;`
      );
    }

    if (clubRes.rowCount === 0) {
      throw new NotFoundError(`Club organization '${clubId || 'default'}' does not exist.`);
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

      // Expand allowed roles with equivalents (e.g. PRESIDENT <-> ASSOCIATION_INCHARGE)
      const normalizedAllowed = allowedRoles.flatMap((r) => {
        const upper = r.toUpperCase();
        if (upper === 'ASSOCIATION_INCHARGE') return ['ASSOCIATION_INCHARGE'];
        if (upper === 'ASSOCIATION_COORDINATOR') return ['ASSOCIATION_COORDINATOR'];
        return [upper];
      });

      if (normalizedAllowed.includes(userRole)) {
        return next();
      }

      // If club tenant context exists, check member's specific club permissions
      if (req.clubId) {
        const membershipRes = await query(
          `SELECT role, tier, status 
           FROM club_memberships 
           WHERE club_id = $1 AND user_id = $2 LIMIT 1;`,
          [req.clubId, req.user.id]
        );

        if (membershipRes.rowCount > 0) {
          const membership = membershipRes.rows[0];
          const memberRole = (membership.role || '').toUpperCase();
          const memberTier = (membership.tier || '').toUpperCase();
          if (normalizedAllowed.includes(memberRole) || normalizedAllowed.includes(memberTier)) {
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
