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
      `SELECT id, slug, name, description, logo_url, banner_url, primary_color, annual_dues_cents, is_active, created_at
       FROM clubs
       WHERE is_active = true
       ORDER BY name ASC;`
    );
    return res.rows;
  }
}
