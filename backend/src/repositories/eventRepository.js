import { query } from '../config/db.js';

export class EventRepository {
  static async findEventsByClub(clubId, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `SELECT e.*, 
              COALESCE(SUM(ett.allocation_limit), 0) as total_capacity,
              COALESCE(SUM(ett.issued_count), 0) as total_tickets_sold,
              COALESCE(
                JSON_AGG(
                  JSON_BUILD_OBJECT(
                    'id', ett.id,
                    'eventId', e.id,
                    'name', ett.name,
                    'description', ett.description,
                    'member_price_cents', ett.member_price_cents,
                    'non_member_price_cents', ett.non_member_price_cents,
                    'memberPriceCents', ett.member_price_cents,
                    'nonMemberPriceCents', ett.non_member_price_cents,
                    'allocation_limit', ett.allocation_limit,
                    'issued_count', ett.issued_count,
                    'reserved_count', ett.reserved_count,
                    'sales_open_at', ett.sales_open_at,
                    'sales_close_at', ett.sales_close_at
                  )
                ) FILTER (WHERE ett.id IS NOT NULL),
                '[]'::json
              ) as tiers
       FROM events e
       LEFT JOIN event_ticket_tiers ett ON e.id = ett.event_id
       WHERE e.club_id = $1
       GROUP BY e.id
       ORDER BY e.starts_at ASC;`,
      [clubId]
    );
    return res.rows;
  }

  static async findEventById(eventId, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `SELECT * FROM events WHERE id = $1 LIMIT 1;`,
      [eventId]
    );
    return res.rows[0] || null;
  }

  static async findTiersByEventId(eventId, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `SELECT *, (allocation_limit - (issued_count + reserved_count)) as remaining_seats,
              non_member_price_cents as price_cents
       FROM event_ticket_tiers
       WHERE event_id = $1
       ORDER BY non_member_price_cents ASC;`,
      [eventId]
    );
    return res.rows;
  }

  static async findTierByIdForUpdate(tierId, client) {
    const res = await client.query(
      `SELECT *, (allocation_limit - (issued_count + reserved_count)) as remaining_seats,
              non_member_price_cents as price_cents
       FROM event_ticket_tiers
       WHERE id = $1
       FOR UPDATE;`,
      [tierId]
    );
    return res.rows[0] || null;
  }

  static async reserveTierSeat(tierId, client) {
    const res = await client.query(
      `UPDATE event_ticket_tiers
       SET reserved_count = reserved_count + 1, updated_at = NOW()
       WHERE id = $1 AND (allocation_limit - (issued_count + reserved_count)) >= 1
       RETURNING id, reserved_count, issued_count;`,
      [tierId]
    );
    return res.rows[0] || null;
  }

  static async releaseTierSeat(tierId, client) {
    const res = await client.query(
      `UPDATE event_ticket_tiers
       SET reserved_count = GREATEST(0, reserved_count - 1), updated_at = NOW()
       WHERE id = $1
       RETURNING id, reserved_count, issued_count;`,
      [tierId]
    );
    return res.rows[0] || null;
  }

  static async finalizeTierSeat(tierId, client) {
    const res = await client.query(
      `UPDATE event_ticket_tiers
       SET issued_count = issued_count + 1,
           reserved_count = GREATEST(0, reserved_count - 1),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, reserved_count, issued_count;`,
      [tierId]
    );
    return res.rows[0] || null;
  }

  static async createTicket({ eventId, tierId, userId, ticketCode, qrSignature, status = 'RESERVED', pricePaidCents, reservedUntil = null }, client) {
    const res = await client.query(
      `INSERT INTO tickets (event_id, tier_id, user_id, ticket_code, qr_signature, status, price_paid_cents, reserved_until)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *;`,
      [eventId, tierId, userId, ticketCode, qrSignature, status, pricePaidCents, reservedUntil]
    );
    return res.rows[0];
  }

  static async findTicketByCode(ticketCode, eventId = null, client = null) {
    const runner = client || { query };
    const sql = eventId
      ? `SELECT t.*, u.name as attendee_name, up.student_id_number as student_id, u.email as attendee_email,
                ett.name as tier_name, e.title as event_title, e.club_id
         FROM tickets t
         JOIN users u ON t.user_id = u.id
         LEFT JOIN user_profiles up ON u.id = up.user_id
         JOIN event_ticket_tiers ett ON t.tier_id = ett.id
         JOIN events e ON t.event_id = e.id
         WHERE t.ticket_code = $1 AND (t.event_id::text = $2 OR e.slug = $2)
         LIMIT 1;`
      : `SELECT t.*, u.name as attendee_name, up.student_id_number as student_id, u.email as attendee_email,
                ett.name as tier_name, e.title as event_title, e.club_id
         FROM tickets t
         JOIN users u ON t.user_id = u.id
         LEFT JOIN user_profiles up ON u.id = up.user_id
         JOIN event_ticket_tiers ett ON t.tier_id = ett.id
         JOIN events e ON t.event_id = e.id
         WHERE t.ticket_code = $1
         LIMIT 1;`;
    const params = eventId ? [ticketCode, eventId] : [ticketCode];
    const res = await runner.query(sql, params);
    return res.rows[0] || null;
  }

  static isUuid(str) {
    return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  }

  static async findTicketByIdForUpdate(ticketId, client) {
    const isIdUuid = this.isUuid(ticketId);
    const sql = isIdUuid
      ? `SELECT * FROM tickets WHERE id = $1 FOR UPDATE;`
      : `SELECT * FROM tickets WHERE ticket_code = $1 FOR UPDATE;`;
    const res = await client.query(sql, [ticketId]);
    return res.rows[0] || null;
  }

  static async updateTicketStatus(ticketId, status, client = null) {
    const runner = client || { query };
    const isIdUuid = this.isUuid(ticketId);
    const sql = isIdUuid
      ? `UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *;`
      : `UPDATE tickets SET status = $1, updated_at = NOW() WHERE ticket_code = $2 RETURNING *;`;
    const res = await runner.query(sql, [status, ticketId]);
    return res.rows[0] || null;
  }

  /**
   * Ultra-fast atomic check-in execution (Sub-200ms target).
   * Executes transactional UPDATE ... WHERE status = 'ISSUED'.
   * Rejects duplicate scans immediately.
   */
  static async atomicCheckIn(ticketCode, eventId, scannedByUserId, verificationHash, client) {
    const updateRes = await client.query(
      `UPDATE tickets
       SET status = 'CHECKED_IN',
           checked_in_at = NOW(),
           updated_at = NOW()
       WHERE ticket_code = $1 
         AND event_id = $2 
         AND status = 'ISSUED'
       RETURNING id, event_id, tier_id, user_id, ticket_code, checked_in_at;`,
      [ticketCode, eventId]
    );

    if (updateRes.rowCount === 0) {
      // Find reason for failure (already checked in, cancelled, etc.)
      const checkRes = await client.query(
        `SELECT t.id, t.status, t.checked_in_at, c.scanned_at, u.name as scanned_by_name
         FROM tickets t
         LEFT JOIN check_ins c ON c.ticket_id = t.id
         LEFT JOIN users u ON c.scanned_by_user_id = u.id
         WHERE t.ticket_code = $1 AND t.event_id = $2
         LIMIT 1;`,
        [ticketCode, eventId]
      );
      return { success: false, ticket: checkRes.rows[0] || null };
    }

    const ticket = updateRes.rows[0];

    // Log audit check-in record
    await client.query(
      `INSERT INTO check_ins (ticket_id, scanned_by_user_id, verification_hash)
       VALUES ($1, $2, $3);`,
      [ticket.id, scannedByUserId, verificationHash]
    );

    return { success: true, ticket };
  }

  static async getEventFinancialSummary(eventId, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `SELECT * FROM view_event_financial_summary WHERE event_id = $1 LIMIT 1;`,
      [eventId]
    );
    return res.rows[0] || null;
  }
}
