import { query } from './db.js';

async function main() {
  try {
    await query(`
      UPDATE club_memberships
      SET valid_until = '2027-06-30T23:59:59Z',
          valid_from = '2025-06-01T00:00:00Z',
          status = 'ACTIVE'
      WHERE status = 'ACTIVE' OR valid_until < NOW();
    `);
    console.log('Successfully updated club_memberships valid_until to 2027.');
  } catch (err) {
    console.error('Error updating memberships:', err.message);
  } finally {
    process.exit(0);
  }
}

main();
