import { query } from '../config/db.js';

export class MembershipRepository {
  static async findByClubAndUser(clubId, userId, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `SELECT cm.id, cm.club_id, cm.user_id, cm.role, cm.tier, cm.status, 
              cm.valid_from, cm.valid_until, cm.qr_secret_token, cm.dues_paid_cents,
              cm.created_at, cm.updated_at,
              u.name as full_name, u.email, up.student_id_number as student_id, u.image as avatar_url
       FROM club_memberships cm
       JOIN users u ON cm.user_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE cm.club_id = $1 AND cm.user_id = $2
       LIMIT 1;`,
      [clubId, userId]
    );
    return res.rows[0] || null;
  }

  static async findById(id, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `SELECT cm.id, cm.club_id, cm.user_id, cm.role, cm.tier, cm.status, 
              cm.valid_from, cm.valid_until, cm.qr_secret_token, cm.dues_paid_cents,
              cm.created_at, cm.updated_at,
              u.name as full_name, u.email, up.student_id_number as student_id, u.image as avatar_url
       FROM club_memberships cm
       JOIN users u ON cm.user_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE cm.id = $1
       LIMIT 1;`,
      [id]
    );
    return res.rows[0] || null;
  }

  static async findByQrToken(clubId, qrSecretToken, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `SELECT cm.id, cm.club_id, cm.user_id, cm.role, cm.tier, cm.status, 
              cm.valid_from, cm.valid_until, cm.qr_secret_token, cm.dues_paid_cents,
              cm.created_at,
              u.name as full_name, u.email, up.student_id_number as student_id, u.image as avatar_url
       FROM club_memberships cm
       JOIN users u ON cm.user_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE cm.club_id = $1 AND cm.qr_secret_token = $2
       LIMIT 1;`,
      [clubId, qrSecretToken]
    );
    return res.rows[0] || null;
  }

  static async createMembership({ clubId, userId, tier = 'STANDARD', role = 'MEMBER', status = 'PENDING_PAYMENT', duesPaidCents = 0, validUntil, qrSecretToken }, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `INSERT INTO club_memberships (club_id, user_id, tier, role, status, dues_paid_cents, valid_from, valid_until, qr_secret_token)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8)
       RETURNING *;`,
      [clubId, userId, tier === 'GENERAL' ? 'STANDARD' : tier, role, status, duesPaidCents, validUntil, qrSecretToken]
    );
    return res.rows[0];
  }

  static async updateStatus(id, status, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `UPDATE club_memberships
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *;`,
      [status, id]
    );
    return res.rows[0] || null;
  }

  static async renewMembership(id, { validUntil, qrSecretToken, duesPaidCents = 0 }, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `UPDATE club_memberships
       SET status = 'ACTIVE',
           valid_until = $1,
           qr_secret_token = $2,
           dues_paid_cents = dues_paid_cents + $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *;`,
      [validUntil, qrSecretToken, duesPaidCents, id]
    );
    return res.rows[0] || null;
  }

  static async findExpiringSoon(daysThreshold = 30, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `SELECT cm.id, cm.club_id, cm.user_id, cm.valid_until, cm.status,
              u.email, u.name as full_name
       FROM club_memberships cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.status IN ('ACTIVE', 'RENEWAL_DUE')
         AND cm.valid_until <= (NOW() + ($1 || ' days')::INTERVAL)
         AND cm.valid_until > NOW()
         AND NOT EXISTS (
           SELECT 1 FROM membership_renewal_reminders mrr
           WHERE mrr.membership_id = cm.id
             AND mrr.dispatched_at >= NOW() - INTERVAL '6 days'
         );`,
      [daysThreshold]
    );
    return res.rows;
  }

  static async transitionGracePeriods(client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `UPDATE club_memberships
       SET status = 'GRACE_PERIOD', updated_at = NOW()
       WHERE status = 'ACTIVE' AND valid_until <= NOW()
       RETURNING id, club_id, user_id;`
    );
    return res.rows;
  }

  static async transitionHardExpirations(graceDays = 14, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `UPDATE club_memberships
       SET status = 'EXPIRED', updated_at = NOW()
       WHERE status = 'GRACE_PERIOD' 
         AND valid_until <= (NOW() - ($1 || ' days')::INTERVAL)
       RETURNING id, club_id, user_id;`,
      [graceDays]
    );
    return res.rows;
  }

  static async logRenewalReminder({ membershipId, reminderType, recipientEmail, deliveryStatus = 'SENT', oneClickUrl = '' }, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `INSERT INTO membership_renewal_reminders (membership_id, reminder_type, recipient_email, delivery_status, one_click_renewal_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *;`,
      [membershipId, reminderType, recipientEmail, deliveryStatus, oneClickUrl]
    );
    return res.rows[0];
  }
}
