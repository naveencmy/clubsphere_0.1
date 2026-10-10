import { query } from '../config/db.js';

export class CollaborationRepository {
  // --- Announcements ---

  static async findAnnouncementsByClub(clubId, audience = null, client = null) {
    const runner = client || { query };
    const sql = audience
      ? `SELECT a.id, a.club_id, a.author_id, a.title, 
                a.content_markdown as content, a.content_markdown,
                a.is_pinned, a.target_audience, a.published_at, a.audit_hash,
                a.created_at, a.updated_at,
                u.name as author_name,
                (SELECT COUNT(*) FROM announcement_read_receipts WHERE announcement_id = a.id) as read_count
         FROM announcements a
         JOIN users u ON a.author_id = u.id
         WHERE a.club_id = $1 AND (a.target_audience = $2 OR a.target_audience = 'PUBLIC' OR a.target_audience = 'ALL_MEMBERS')
         ORDER BY a.published_at DESC;`
      : `SELECT a.id, a.club_id, a.author_id, a.title, 
                a.content_markdown as content, a.content_markdown,
                a.is_pinned, a.target_audience, a.published_at, a.audit_hash,
                a.created_at, a.updated_at,
                u.name as author_name,
                (SELECT COUNT(*) FROM announcement_read_receipts WHERE announcement_id = a.id) as read_count
         FROM announcements a
         JOIN users u ON a.author_id = u.id
         WHERE a.club_id = $1
         ORDER BY a.published_at DESC;`;
    const params = audience ? [clubId, audience] : [clubId];
    const res = await runner.query(sql, params);
    return res.rows;
  }

  static async findAnnouncementById(id, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `SELECT a.id, a.club_id, a.author_id, a.title,
              a.content_markdown as content, a.content_markdown,
              a.is_pinned, a.target_audience, a.published_at, a.audit_hash,
              a.created_at, a.updated_at,
              u.name as author_name, u.email as author_email
       FROM announcements a
       JOIN users u ON a.author_id = u.id
       WHERE a.id = $1 LIMIT 1;`,
      [id]
    );
    return res.rows[0] || null;
  }

  static async createAnnouncement({ clubId, authorUserId, title, content, targetAudience = 'ALL_MEMBERS', contentHash }, client) {
    const res = await client.query(
      `INSERT INTO announcements (club_id, author_id, title, content_markdown, target_audience, audit_hash)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *, content_markdown as content;`,
      [clubId, authorUserId, title, content, targetAudience, contentHash]
    );
    return res.rows[0];
  }

  static async createAnnouncementRevision({ announcementId, editorUserId, title, content, contentHash, revisionNumber }, client) {
    const res = await client.query(
      `INSERT INTO announcement_revisions (announcement_id, edited_by_user_id, title, content_markdown, revision_hash, revision_number)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *, content_markdown as content;`,
      [announcementId, editorUserId, title, content, contentHash, revisionNumber]
    );
    return res.rows[0];
  }

  static async updateAnnouncement(id, { title, content, contentHash }, client) {
    const res = await client.query(
      `UPDATE announcements
       SET title = $1, content_markdown = $2, audit_hash = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *, content_markdown as content;`,
      [title, content, contentHash, id]
    );
    return res.rows[0] || null;
  }

  static async findRevisions(announcementId, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `SELECT ar.id, ar.announcement_id, ar.revision_number, ar.title,
              ar.content_markdown as content, ar.content_markdown,
              ar.edited_by_user_id, ar.edited_at, ar.revision_hash,
              u.name as editor_name
       FROM announcement_revisions ar
       JOIN users u ON ar.edited_by_user_id = u.id
       WHERE ar.announcement_id = $1
       ORDER BY ar.revision_number DESC;`,
      [announcementId]
    );
    return res.rows;
  }

  static async logDelivery({ announcementId, recipientUserId, channel = 'EMAIL', deliveryStatus = 'QUEUED' }, client) {
    const res = await client.query(
      `INSERT INTO announcement_deliveries (announcement_id, user_id, channel, delivery_status)
       VALUES ($1, $2, $3, $4)
       RETURNING *;`,
      [announcementId, recipientUserId, channel, deliveryStatus]
    );
    return res.rows[0];
  }

  static async markRead(announcementId, userId, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `INSERT INTO announcement_read_receipts (announcement_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (announcement_id, user_id) DO NOTHING
       RETURNING *;`,
      [announcementId, userId]
    );
    return res.rows[0] || null;
  }

  // --- Kanban Tasks & Fundraisers ---

  static async findFundraisersByClub(clubId, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `SELECT f.*, e.title as event_title,
              (SELECT COUNT(*) FROM tasks WHERE fundraiser_id = f.id) as task_count,
              (SELECT COUNT(*) FROM tasks WHERE fundraiser_id = f.id AND status = 'DONE') as completed_task_count
       FROM fundraisers f
       LEFT JOIN events e ON f.event_id = e.id
       WHERE f.club_id = $1
       ORDER BY f.created_at DESC;`,
      [clubId]
    );
    return res.rows;
  }

  static async createFundraiser({ clubId, eventId = null, title, description, targetAmountCents, startDate = null, endDate = null }, client = null) {
    const runner = client || { query };
    const start = startDate || new Date();
    const end = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const res = await runner.query(
      `INSERT INTO fundraisers (club_id, event_id, title, description, target_amount_cents, starts_at, ends_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *;`,
      [clubId, eventId, title, description, targetAmountCents, start, end]
    );
    return res.rows[0];
  }

  static async findTasks({ clubId, eventId = null, fundraiserId = null, status = null }, client = null) {
    const runner = client || { query };
    let sql = `SELECT t.id, t.club_id, t.event_id, t.fundraiser_id, t.creator_id, t.assigned_to_user_id,
                      t.title, t.description_markdown as description, t.description_markdown,
                      t.priority, t.status, t.due_date, t.checklist_items, t.created_at, t.updated_at,
                      u.name as assignee_name, u.image as assignee_avatar,
                      f.title as fundraiser_title, e.title as event_title
               FROM tasks t
               LEFT JOIN users u ON t.assigned_to_user_id = u.id
               LEFT JOIN fundraisers f ON t.fundraiser_id = f.id
               LEFT JOIN events e ON t.event_id = e.id
               WHERE t.club_id = $1`;
    const params = [clubId];

    if (eventId) {
      params.push(eventId);
      sql += ` AND t.event_id = $${params.length}`;
    }
    if (fundraiserId) {
      params.push(fundraiserId);
      sql += ` AND t.fundraiser_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      sql += ` AND t.status = $${params.length}`;
    }

    sql += ` ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC;`;

    const res = await runner.query(sql, params);
    return res.rows;
  }

  static async createTask({ clubId, creatorId, eventId = null, fundraiserId = null, title, description, status = 'TODO', priority = 'MEDIUM', assigneeUserId = null, dueDate = null }, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `INSERT INTO tasks (club_id, creator_id, event_id, fundraiser_id, title, description_markdown, status, priority, assigned_to_user_id, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *, description_markdown as description;`,
      [clubId, creatorId, eventId, fundraiserId, title, description, status, priority, assigneeUserId, dueDate]
    );
    return res.rows[0];
  }

  static async updateTaskStatus(taskId, status, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `UPDATE tasks
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *, description_markdown as description;`,
      [status, taskId]
    );
    return res.rows[0] || null;
  }

  // --- Shifts ---

  static async findShifts(clubId, fundraiserId = null, client = null) {
    const runner = client || { query };
    let sql = `SELECT vs.*,
                      u.name as volunteer_name, u.email as volunteer_email, up.student_id_number as student_id
               FROM volunteer_shifts vs
               LEFT JOIN users u ON vs.volunteer_user_id = u.id
               LEFT JOIN user_profiles up ON u.id = up.user_id
               WHERE vs.club_id = $1`;
    const params = [clubId];

    if (fundraiserId) {
      params.push(fundraiserId);
      sql += ` AND vs.fundraiser_id = $${params.length}`;
    }
    sql += ` ORDER BY vs.starts_at ASC;`;

    const res = await runner.query(sql, params);
    return res.rows;
  }

  static async claimShift(shiftId, userId, client) {
    const updateRes = await client.query(
      `UPDATE volunteer_shifts
       SET volunteer_user_id = $2, updated_at = NOW()
       WHERE id = $1 AND volunteer_user_id IS NULL
       RETURNING *;`,
      [shiftId, userId]
    );

    if (updateRes.rowCount === 0) {
      return { success: false, reason: 'Shift is already claimed or not found' };
    }

    return { success: true, shift: updateRes.rows[0] };
  }
}
