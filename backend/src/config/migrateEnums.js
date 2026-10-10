import { query } from './db.js';

async function migrate() {
  console.log(' Updating PostgreSQL role enums...');
  try {
    // 1. Temporarily change column type to text
    await query('ALTER TABLE club_memberships ALTER COLUMN role TYPE text;');
    // 2. Drop existing club_role type
    await query('DROP TYPE IF EXISTS club_role CASCADE;');
    // 3. Create new club_role enum without PRESIDENT and VICE_PRESIDENT
    await query(`CREATE TYPE club_role AS ENUM (
      'ASSOCIATION_INCHARGE',
      'ASSOCIATION_COORDINATOR',
      'TREASURER',
      'SECRETARY',
      'COMMITTEE_LEAD',
      'VOLUNTEER',
      'MEMBER'
    );`);
    // 4. Restore column type
    await query('ALTER TABLE club_memberships ALTER COLUMN role TYPE club_role USING role::club_role;');

    // 5. Add INCHARGE_APPROVED to reimbursement_status if not exists
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
          WHERE pg_type.typname = 'reimbursement_status' AND pg_enum.enumlabel = 'INCHARGE_APPROVED'
        ) THEN
          ALTER TYPE reimbursement_status ADD VALUE 'INCHARGE_APPROVED' AFTER 'TREASURER_APPROVED';
        END IF;
      END $$;
    `);

    console.log(' Successfully updated PostgreSQL club_role enum (no PRESIDENT / VICE_PRESIDENT) and reimbursement_status!');
  } catch (err) {
    console.error(' Migration failed:', err);
    throw err;
  }
}

migrate().then(() => process.exit(0)).catch(() => process.exit(1));
