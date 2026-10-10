import { query } from "./db.js";

// Better Auth 1.7 identifies credential accounts by user ID, rather than email.
// Preserve account IDs, password hashes, users and all business records.
export async function migrateAuthAccounts() {
  return query(
    "UPDATE accounts SET account_id = user_id::text WHERE provider_id = 'credential' AND account_id IS DISTINCT FROM user_id::text",
  );
}
