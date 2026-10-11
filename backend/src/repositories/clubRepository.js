import { query } from '../config/db.js';

export class ClubRepository {
  static async findById(id, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `SELECT * FROM clubs WHERE id = $1 LIMIT 1;`,
      [id]
    );
    return res.rows[0] || null;
  }

  static async findBySlug(slug, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `SELECT * FROM clubs WHERE slug = $1 LIMIT 1;`,
      [slug]
    );
    return res.rows[0] || null;
  }

  static async listActiveClubs(client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `SELECT * FROM clubs
       WHERE is_active = true
       ORDER BY name ASC;`
    );
    return res.rows;
  }

  static async listMembers(clubIdOrSlug, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `SELECT u.id, u.name, u.email, u.system_role,
              cm.role as club_role, cm.tier, cm.status as membership_status,
              up.student_id_number as student_id, up.phone_number, up.academic_major, up.graduation_year
       FROM users u
       JOIN club_memberships cm ON u.id = cm.user_id
       JOIN clubs c ON cm.club_id = c.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE c.id::text = $1 OR c.slug = $1
       ORDER BY u.name ASC;`,
      [clubIdOrSlug]
    );
    return res.rows;
  }
}
