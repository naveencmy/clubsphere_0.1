import cron from 'node-cron';
import { app } from './app.js';
import { config } from './config/env.js';
import { pool, checkDatabaseConnection, query } from './config/db.js';
import { MembershipService } from './services/membershipService.js';
import { migrateAuthAccounts } from './config/migrateAuthAccounts.js';

let server;

async function startServer() {
  // Check database connectivity
  const dbHealth = await checkDatabaseConnection();
  if (!dbHealth.connected) {
    console.warn(' Database connection check failed on startup:', dbHealth.error);
    console.warn('Starting server anyway (database may become available later).');
  } else {
    await migrateAuthAccounts();
    console.log(`Connected to PostgreSQL database [${dbHealth.database}] at ${dbHealth.timestamp}`);
  }

  // Schedule background workers
  if (config.NODE_ENV !== 'test') {
    // 1. Daily midnight renewal expiration & grace-period worker
    cron.schedule('0 2 * * *', async () => {
      console.log(' [CRON] Running daily membership expiration & grace-period audit...');
      try {
        const results = await MembershipService.runExpirationCheck();
        console.log(' [CRON] Expiration check completed:', results);
      } catch (err) {
        console.error(' [CRON] Expiration check error:', err.message);
      }
    });

    // 2. Every 1 minute: Clean up expired 10-minute ticket holds
    cron.schedule('* * * * *', async () => {
      try {
        const expiredTickets = await query(
          `UPDATE tickets
           SET status = 'CANCELLED', updated_at = NOW()
           WHERE status = 'RESERVED' AND reserved_until < NOW()
           RETURNING id, tier_id;`
        );

        if (expiredTickets.rowCount > 0) {
          for (const row of expiredTickets.rows) {
            await query(
              `UPDATE event_ticket_tiers
               SET reserved_count = GREATEST(0, reserved_count - 1), updated_at = NOW()
               WHERE id = $1;`,
              [row.tier_id]
            );
          }
          console.log(`🧹 [CLEANUP] Released ${expiredTickets.rowCount} expired ticket holds.`);
        }
      } catch (err) {
        // Suppress or log non-critical background worker exceptions
        if (config.NODE_ENV === 'development') {
          console.warn('[CLEANUP] Ticket hold background runner notice:', err.message);
        }
      }
    });
  }

  server = app.listen(config.PORT, () => {
    console.log(` ClubSphere Backend running on http://localhost:${config.PORT} [${config.NODE_ENV}]`);
    console.log(` Health probe available at: http://localhost:${config.PORT}/health`);
  });
}

// Graceful shutdown handling
async function shutdown(signal) {
  console.log(`\n Received ${signal}. Starting graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log(' HTTP server closed.');
      try {
        await pool.end();
        console.log(' PostgreSQL connection pool drained.');
        process.exit(0);
      } catch (err) {
        console.error(' Error draining database pool:', err);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer().catch((err) => {
  console.error(' Fatal error starting server:', err);
  process.exit(1);
});
