import { query } from './db.js';

export async function migrateBetterAuthTypes() {
  console.log('🔄 Migrating Better Auth table columns to TEXT to prevent VARCHAR(255) truncation...');
  
  await query(`
    ALTER TABLE verifications ALTER COLUMN value TYPE TEXT;
    ALTER TABLE verifications ALTER COLUMN identifier TYPE TEXT;
    ALTER TABLE verifications ALTER COLUMN id TYPE TEXT;
    
    ALTER TABLE sessions ALTER COLUMN token TYPE TEXT;
    ALTER TABLE sessions ALTER COLUMN id TYPE TEXT;
    ALTER TABLE sessions ALTER COLUMN ip_address TYPE TEXT;
    
    ALTER TABLE accounts ALTER COLUMN account_id TYPE TEXT;
    ALTER TABLE accounts ALTER COLUMN id TYPE TEXT;
    ALTER TABLE accounts ALTER COLUMN provider_id TYPE TEXT;
    
    ALTER TABLE users ALTER COLUMN name TYPE TEXT;
  `);
  
  console.log('✅ Migrated verifications, sessions, accounts, and users columns to TEXT successfully.');
}

migrateBetterAuthTypes()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration error:', err);
    process.exit(1);
  });
