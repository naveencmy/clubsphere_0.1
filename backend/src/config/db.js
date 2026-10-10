import pg from 'pg';
import { config } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error on idle client:', err);
});

/**
 * Execute parameterized query on the pool.
 * @param {string} text - SQL query text
 * @param {Array<any>} params - Parameterized query arguments
 * @returns {Promise<pg.QueryResult>}
 */
export async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (config.NODE_ENV === 'development' && duration > 200) {
      console.warn(`⚠️ Slow query (${duration}ms): ${text.substring(0, 100)}...`);
    }
    return res;
  } catch (err) {
    console.error('❌ Database query error:', { query: text, params, error: err.message });
    throw err;
  }
}

/**
 * Executes a callback within a managed database transaction.
 * Automatically handles BEGIN, SET LOCAL tenant context, COMMIT, and ROLLBACK.
 * 
 * @template T
 * @param {(client: pg.PoolClient) => Promise<T>} callback
 * @param {string|null} [clubId=null] - Optional club_id to enforce multi-tenant isolation
 * @returns {Promise<T>}
 */
export async function withTransaction(callback, clubId = null) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');

    if (clubId) {
      // Enforce multi-tenant Row Level Security session context
      await client.query('SET LOCAL app.current_club_id = $1;', [clubId]);
    }

    const result = await callback(client);
    await client.query('COMMIT;');
    return result;
  } catch (error) {
    await client.query('ROLLBACK;');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Verify database connectivity.
 */
export async function checkDatabaseConnection() {
  try {
    const res = await query('SELECT NOW() as current_time, current_database() as db;');
    return { connected: true, timestamp: res.rows[0].current_time, database: res.rows[0].db };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}
