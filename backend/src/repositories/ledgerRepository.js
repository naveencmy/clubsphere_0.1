import { query } from '../config/db.js';
import { BadRequestError } from '../utils/errors.js';
import { generateReferenceCode } from '../utils/crypto.js';

export class LedgerRepository {
  static async findAccountsByClub(clubId, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `SELECT id, club_id, account_code, account_name,
              account_code as code, account_name as name,
              type, balance_cents, created_at, updated_at
       FROM ledger_accounts 
       WHERE club_id = $1
       ORDER BY account_code ASC;`,
      [clubId]
    );
    return res.rows;
  }

  static async findAccountByCode(clubId, code, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `SELECT id, club_id, account_code, account_name,
              account_code as code, account_name as name,
              type, balance_cents, created_at, updated_at
       FROM ledger_accounts 
       WHERE club_id = $1 AND account_code = $2
       LIMIT 1;`,
      [clubId, code]
    );
    return res.rows[0] || null;
  }

  /**
   * Records a balanced double-entry journal transaction.
   * Enforces mathematical invariant: Total Debits === Total Credits.
   */
  static async createJournalEntry({ clubId, entryNumber = null, entryDate = new Date(), description, referenceType = 'MANUAL_ADJUSTMENT', referenceId = null, postedByUserId = null, createdByUserId = null, lines = [] }, client) {
    if (!lines || lines.length < 2) {
      throw new BadRequestError('A journal entry must contain at least two line items.');
    }

    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of lines) {
      totalDebit += line.debitCents || 0;
      totalCredit += line.creditCents || 0;
    }

    if (totalDebit !== totalCredit) {
      throw new BadRequestError(
        `Journal entry is out of balance. Total Debits (₹${(totalDebit / 100).toFixed(2)}) must equal Total Credits (₹${(totalCredit / 100).toFixed(2)}).`
      );
    }

    const jEntryNumber = entryNumber || generateReferenceCode('JRN');
    const posterId = postedByUserId || createdByUserId;

    const entryRes = await client.query(
      `INSERT INTO journal_entries (club_id, entry_number, description, reference_type, reference_id, posted_by_user_id, posted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *;`,
      [clubId, jEntryNumber, description, referenceType, referenceId, posterId, entryDate]
    );

    const entry = entryRes.rows[0];

    for (const line of lines) {
      await client.query(
        `INSERT INTO ledger_lines (journal_entry_id, account_id, debit_cents, credit_cents, description)
         VALUES ($1, $2, $3, $4, $5);`,
        [entry.id, line.accountId, line.debitCents || 0, line.creditCents || 0, line.description || null]
      );
    }

    entry.lines = lines;
    return entry;
  }

  static async findJournalEntries(clubId, limit = 50, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `SELECT je.*, 
              (SELECT json_agg(json_build_object(
                'account_id', ll.account_id,
                'account_code', la.account_code,
                'account_name', la.account_name,
                'debit_cents', ll.debit_cents,
                'credit_cents', ll.credit_cents,
                'description', ll.description
              ))
              FROM ledger_lines ll
              JOIN ledger_accounts la ON ll.account_id = la.id
              WHERE ll.journal_entry_id = je.id) as lines
       FROM journal_entries je
       WHERE je.club_id = $1
       ORDER BY je.posted_at DESC, je.created_at DESC
       LIMIT $2;`,
      [clubId, limit]
    );
    return res.rows;
  }

  // --- Budgets ---

  static async findBudgets(clubId, fiscalYear = '2025-2026', client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `SELECT b.*, e.title as event_title
       FROM budgets b
       LEFT JOIN events e ON b.event_id = e.id
       WHERE b.club_id = $1 AND b.fiscal_year = $2
       ORDER BY b.category ASC;`,
      [clubId, fiscalYear]
    );
    return res.rows;
  }

  static async getBudgetVariance(clubId, fiscalYear = '2025-2026', client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `SELECT * FROM view_budget_variance
       WHERE club_id = $1 AND fiscal_year = $2;`,
      [clubId, fiscalYear]
    );
    return res.rows;
  }

  static async getTreasurerSummary(clubId, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `SELECT * FROM view_treasurer_financial_summary
       WHERE club_id = $1 LIMIT 1;`,
      [clubId]
    );
    return res.rows[0] || null;
  }

  // --- Expense Reimbursements ---

  static async createExpense({ clubId, claimantUserId, title, category, merchantName, purchaseDate, amountCents, description, receiptImageUrl, eventId = null, budgetId = null }, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `INSERT INTO expense_reimbursements 
       (club_id, claimant_user_id, title, category, merchant_name, purchase_date, amount_cents, description, receipt_image_url, status, event_id, budget_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'SUBMITTED', $10, $11)
       RETURNING *;`,
      [clubId, claimantUserId, title, category, merchantName, purchaseDate, amountCents, description, receiptImageUrl, eventId, budgetId]
    );
    return res.rows[0];
  }

  static async findExpenseById(id, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `SELECT er.*, u.name as claimant_name, u.email as claimant_email, up.student_id_number as student_id,
              e.title as event_title, b.category as budget_category
       FROM expense_reimbursements er
       JOIN users u ON er.claimant_user_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       LEFT JOIN events e ON er.event_id = e.id
       LEFT JOIN budgets b ON er.budget_id = b.id
       WHERE er.id = $1 LIMIT 1;`,
      [id]
    );
    return res.rows[0] || null;
  }

  static async findExpensesByClub(clubId, status = null, client = null) {
    const runner = client || { query };
    let sql = `SELECT er.*, u.name as claimant_name, u.email as claimant_email, up.student_id_number as student_id,
                      e.title as event_title
               FROM expense_reimbursements er
               JOIN users u ON er.claimant_user_id = u.id
               LEFT JOIN user_profiles up ON u.id = up.user_id
               LEFT JOIN events e ON er.event_id = e.id
               WHERE er.club_id = $1`;
    const params = [clubId];

    if (status) {
      params.push(status);
      sql += ` AND er.status = $${params.length}`;
    }
    sql += ` ORDER BY er.created_at DESC;`;

    const res = await runner.query(sql, params);
    return res.rows;
  }

  static async updateExpenseStatus(id, { status, rejectionReason = null, treasurerApproverId = null, presidentApproverId = null, disbursementMethod = null }, client = null) {
    const runner = client || { query };
    let sql = `UPDATE expense_reimbursements SET status = $1, updated_at = NOW()`;
    const params = [status];

    if (rejectionReason !== null && rejectionReason !== undefined) {
      params.push(rejectionReason);
      sql += `, rejection_reason = $${params.length}`;
    }
    if (treasurerApproverId) {
      params.push(treasurerApproverId);
      sql += `, treasurer_approver_id = $${params.length}, treasurer_approved_at = NOW()`;
    }
    if (presidentApproverId) {
      params.push(presidentApproverId);
      sql += `, president_approver_id = $${params.length}, president_approved_at = NOW()`;
    }
    if (disbursementMethod) {
      params.push(disbursementMethod);
      sql += `, disbursement_method = $${params.length}, disbursed_at = NOW()`;
    }

    params.push(id);
    sql += ` WHERE id = $${params.length} RETURNING *;`;

    const res = await runner.query(sql, params);
    return res.rows[0] || null;
  }
}
