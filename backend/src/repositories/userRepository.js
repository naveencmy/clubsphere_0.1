import { query } from '../config/db.js';

export class UserRepository {
  static async findById(id, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `SELECT u.id, u.name, u.email, u.system_role as role, u.image as avatar_url,
              up.student_id_number as student_id, u.created_at, u.updated_at
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = $1 LIMIT 1;`,
      [id]
    );
    return res.rows[0] || null;
  }

  static async findByEmail(email, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `SELECT u.id, u.name, u.email, u.system_role as role, u.image as avatar_url,
              up.student_id_number as student_id, a.password as password_hash,
              u.created_at, u.updated_at
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       LEFT JOIN accounts a ON u.id = a.user_id AND a.provider_id = 'credential'
       WHERE LOWER(u.email) = LOWER($1) LIMIT 1;`,
      [email]
    );
    return res.rows[0] || null;
  }

  static async findByStudentId(studentId, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `SELECT u.id, u.name, u.email, u.system_role as role, u.image as avatar_url,
              up.student_id_number as student_id, u.created_at, u.updated_at
       FROM users u
       JOIN user_profiles up ON u.id = up.user_id
       WHERE up.student_id_number = $1 LIMIT 1;`,
      [studentId]
    );
    return res.rows[0] || null;
  }

  static async createUser({ email, passwordHash, fullName, studentId = null, role = 'STUDENT_USER', avatarUrl = null }, client = null) {
    const runner = client || { query };

    // 1. Insert into users
    const userRes = await runner.query(
      `INSERT INTO users (name, email, image, system_role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, system_role as role, image as avatar_url, created_at;`,
      [fullName, email, avatarUrl, role === 'STUDENT' ? 'STUDENT_USER' : role]
    );
    const user = userRes.rows[0];

    // 2. Insert into accounts (Better Auth credential provider)
    await runner.query(
      `INSERT INTO accounts (id, user_id, account_id, provider_id, password)
       VALUES (gen_random_uuid()::text, $1, $2, 'credential', $3);`,
      [user.id, email, passwordHash]
    );

    // 3. Insert student profile if studentId provided
    if (studentId) {
      await runner.query(
        `INSERT INTO user_profiles (user_id, student_id_number)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET student_id_number = EXCLUDED.student_id_number;`,
        [user.id, studentId]
      );
      user.student_id = studentId;
    }

    return user;
  }
}
