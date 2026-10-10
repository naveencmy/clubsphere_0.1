import { LedgerRepository } from '../repositories/ledgerRepository.js';
import { ClubRepository } from '../repositories/clubRepository.js';
import { withTransaction } from '../config/db.js';
import { sha256 } from '../utils/crypto.js';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from '../utils/errors.js';

const DEFAULT_DUAL_APPROVAL_THRESHOLD_PAISE = 2500; // ₹2,500 standard statutory default

export class LedgerService {
  // --- Journal Entries & General Ledger ---

  static async recordJournalEntry({ clubId, description, referenceType, referenceId, createdByUserId, lines }) {
    return withTransaction(async (client) => {
      return LedgerRepository.createJournalEntry({
        clubId,
        description,
        referenceType,
        referenceId,
        createdByUserId,
        lines,
      }, client);
    }, clubId);
  }

  static async getJournalEntries(clubId, limit = 50) {
    return LedgerRepository.findJournalEntries(clubId, limit);
  }

  static async getAccounts(clubId) {
    return LedgerRepository.findAccountsByClub(clubId);
  }

  // --- Budgets & Variance ---

  static async getBudgetsAndVariance(clubId, fiscalYear = '2025-2026') {
    const rawBudgets = await LedgerRepository.getBudgetVariance(clubId, fiscalYear);

    return rawBudgets.map((b) => {
      const allocatedCents = parseInt(b.allocated_amount_cents, 10) || 0;
      const consumedCents = parseInt(b.actual_spent_cents, 10) || 0;
      const remainingCents = allocatedCents - consumedCents;
      const percentageConsumed = allocatedCents > 0
        ? Math.round((consumedCents / allocatedCents) * 10000) / 100
        : 0;

      let warningThreshold = 'NORMAL'; // Green (< 80%)
      if (percentageConsumed >= 100) {
        warningThreshold = 'EXCEEDED'; // Red (>= 100%)
      } else if (percentageConsumed >= 80) {
        warningThreshold = 'WARNING'; // Amber (80% - 99.99%)
      }

      return {
        ...b,
        allocatedCents,
        consumedCents,
        remainingCents,
        percentageConsumed,
        warningThreshold,
      };
    });
  }

  static async getTreasurerSummary(clubId) {
    const summary = await LedgerRepository.getTreasurerSummary(clubId);
    if (!summary) {
      return {
        clubId,
        totalInflowsCents: 0,
        totalOutflowsCents: 0,
        availableCashBalanceCents: 0,
        pendingLiabilitiesCents: 0,
      };
    }
    return summary;
  }

  // --- Expense Reimbursement Lifecycle & Dual Sign-off ---

  static async submitExpense({ clubId, claimantUserId, title, category, merchantName, purchaseDate, amountCents, description, receiptImageUrl, eventId = null, budgetId = null }) {
    if (!receiptImageUrl) {
      throw new BadRequestError('Mandatory receipt proof required. Image or PDF file must be attached.');
    }

    if (amountCents <= 0) {
      throw new BadRequestError('Expense amount must be greater than zero.');
    }

    const receiptSha256 = sha256(receiptImageUrl);

    return LedgerRepository.createExpense({
      clubId,
      claimantUserId,
      title,
      category,
      merchantName,
      purchaseDate,
      amountCents,
      description,
      receiptImageUrl,
      receiptSha256,
      eventId,
      budgetId,
    });
  }

  static async getExpenses(clubId, status = null) {
    return LedgerRepository.findExpensesByClub(clubId, status);
  }

  static async getExpenseDetails(expenseId) {
    const expense = await LedgerRepository.findExpenseById(expenseId);
    if (!expense) throw new NotFoundError(`Expense claim '${expenseId}' not found.`);
    return expense;
  }

  /**
   * Officer opens claim in lightbox -> transitions to UNDER_REVIEW.
   */
  static async reviewExpense(expenseId) {
    const expense = await LedgerRepository.findExpenseById(expenseId);
    if (!expense) throw new NotFoundError(`Expense claim '${expenseId}' not found.`);

    if (expense.status !== 'SUBMITTED') {
      throw new ConflictError(`Cannot mark claim in status '${expense.status}' as UNDER_REVIEW.`);
    }

    return LedgerRepository.updateExpenseStatus(expenseId, { status: 'UNDER_REVIEW' });
  }

  static async requestCorrection(expenseId, reviewerNotes) {
    if (!reviewerNotes) {
      throw new BadRequestError('Feedback notes are required when requesting correction.');
    }
    const expense = await LedgerRepository.findExpenseById(expenseId);
    if (!expense) throw new NotFoundError(`Expense claim '${expenseId}' not found.`);

    return LedgerRepository.updateExpenseStatus(expenseId, {
      status: 'NEEDS_CORRECTION',
      reviewerNotes,
    });
  }

  static async resubmitExpense(expenseId, claimantUserId, { title, amountCents, description, receiptImageUrl }) {
    const expense = await LedgerRepository.findExpenseById(expenseId);
    if (!expense) throw new NotFoundError(`Expense claim '${expenseId}' not found.`);

    if (expense.claimant_user_id !== claimantUserId) {
      throw new ForbiddenError('Only the original claimant can resubmit this expense.');
    }

    if (expense.status !== 'NEEDS_CORRECTION') {
      throw new ConflictError(`Only claims flagged as NEEDS_CORRECTION can be resubmitted. Current: ${expense.status}`);
    }

    return withTransaction(async (client) => {
      await client.query(
        `UPDATE expense_reimbursements
         SET title = COALESCE($1, title),
             amount_cents = COALESCE($2, amount_cents),
             description = COALESCE($3, description),
             receipt_image_url = COALESCE($4, receipt_image_url),
             status = 'SUBMITTED',
             updated_at = NOW()
         WHERE id = $5;`,
        [title, amountCents, description, receiptImageUrl, expenseId]
      );
      return LedgerRepository.findExpenseById(expenseId, client);
    }, expense.club_id);
  }

  static async rejectExpense(expenseId, rejectionReason) {
    if (!rejectionReason) {
      throw new BadRequestError('Mandatory rejection reason required for audit compliance.');
    }
    const expense = await LedgerRepository.findExpenseById(expenseId);
    if (!expense) throw new NotFoundError(`Expense claim '${expenseId}' not found.`);

    return LedgerRepository.updateExpenseStatus(expenseId, {
      status: 'REJECTED',
      rejectionReason,
    });
  }

  /**
   * Treasurer Primary Approval:
   * - Separation of duties: Claimant cannot approve their own expense.
   * - If < ₹2,500: Serves as Final Approval -> Posts Stage 1 Accrual immediately.
   * - If >= ₹2,500: Awaits President sign-off -> Transitions to TREASURER_APPROVED with NO accrual posted yet.
   */
  static async approveByTreasurer(expenseId, treasurerUserId) {
    const expense = await LedgerRepository.findExpenseById(expenseId);
    if (!expense) throw new NotFoundError(`Expense claim '${expenseId}' not found.`);

    if (expense.claimant_user_id === treasurerUserId) {
      throw new ForbiddenError('Separation of duties violation: Claimants cannot approve their own expense claims.');
    }

    if (expense.status !== 'SUBMITTED' && expense.status !== 'UNDER_REVIEW') {
      throw new ConflictError(`Cannot approve an expense with status '${expense.status}'.`);
    }

    return withTransaction(async (client) => {
      const isUnderThreshold = expense.amount_cents < DUAL_APPROVAL_THRESHOLD_CENTS;

      if (isUnderThreshold) {
        // Single approval is FINAL approval -> Post Stage 1 Accrual
        const expenseAcc = await LedgerRepository.findAccountByCode(expense.club_id, '5020', client)
          || await LedgerRepository.findAccountByCode(expense.club_id, '5010', client);
        const payableAcc = await LedgerRepository.findAccountByCode(expense.club_id, '2010', client);

        if (expenseAcc && payableAcc) {
          await LedgerRepository.createJournalEntry({
            clubId: expense.club_id,
            description: `Expense Accrual (Final Approval) - Claim #${expense.id.substring(0, 8)}`,
            referenceType: 'EXPENSE_ACCRUAL',
            referenceId: expense.id,
            createdByUserId: treasurerUserId,
            lines: [
              { accountId: expenseAcc.id, debitCents: expense.amount_cents, creditCents: 0, description: `Expense: ${expense.category}` },
              { accountId: payableAcc.id, debitCents: 0, creditCents: expense.amount_cents, description: 'Accounts Payable - Claimant' },
            ],
          }, client);
        }
      }

      return LedgerRepository.updateExpenseStatus(expenseId, {
        status: 'TREASURER_APPROVED',
        treasurerApproverId: treasurerUserId,
      }, client);
    }, expense.club_id);
  }

  /**
   * President Secondary Approval (For claims >= ₹2,500):
   * - Separation of duties: Claimant cannot act as President approver.
   * - Serves as FINAL Approval -> Posts Stage 1 Accrual now.
   */
  static async approveByPresident(expenseId, presidentUserId) {
    const expense = await LedgerRepository.findExpenseById(expenseId);
    if (!expense) throw new NotFoundError(`Expense claim '${expenseId}' not found.`);

    if (expense.claimant_user_id === presidentUserId) {
      throw new ForbiddenError('Separation of duties violation: Claimants cannot approve their own expense claims.');
    }

    if (expense.status !== 'TREASURER_APPROVED') {
      throw new ConflictError(`Only claims in status 'TREASURER_APPROVED' can receive President sign-off. Current: ${expense.status}`);
    }

    return withTransaction(async (client) => {
      // Stage 1 Accrual upon final required statutory approval
      const expenseAcc = await LedgerRepository.findAccountByCode(expense.club_id, '5020', client)
        || await LedgerRepository.findAccountByCode(expense.club_id, '5010', client);
      const payableAcc = await LedgerRepository.findAccountByCode(expense.club_id, '2010', client);

      if (expenseAcc && payableAcc) {
        await LedgerRepository.createJournalEntry({
          clubId: expense.club_id,
          description: `Expense Accrual (Dual Sign-Off Final Approval) - Claim #${expense.id.substring(0, 8)}`,
          referenceType: 'EXPENSE_ACCRUAL',
          referenceId: expense.id,
          createdByUserId: presidentUserId,
          lines: [
            { accountId: expenseAcc.id, debitCents: expense.amount_cents, creditCents: 0, description: `Expense: ${expense.category}` },
            { accountId: payableAcc.id, debitCents: 0, creditCents: expense.amount_cents, description: 'Accounts Payable - Claimant' },
          ],
        }, client);
      }

      return LedgerRepository.updateExpenseStatus(expenseId, {
        status: 'INCHARGE_APPROVED',
        presidentApproverId: presidentUserId,
      }, client);
    }, expense.club_id);
  }

  static async approveByIncharge(expenseId, inchargeUserId) {
    return this.approveByPresident(expenseId, inchargeUserId);
  }

  /**
   * Stage 2 Cash Settlement: Payout disbursed by Treasurer.
   * Debits Accounts Payable 2010 (cleared to 0) and Credits Cash Clearing 1010 or Bank 1020.
   */
  static async disburseExpense(expenseId, officerUserId) {
    const expense = await LedgerRepository.findExpenseById(expenseId);
    if (!expense) throw new NotFoundError(`Expense claim '${expenseId}' not found.`);

    const isSmall = expense.amount_cents < DUAL_APPROVAL_THRESHOLD_CENTS;
    const isReady = (isSmall && expense.status === 'TREASURER_APPROVED') || 
                    expense.status === 'INCHARGE_APPROVED' || 
                    expense.status === 'PRESIDENT_APPROVED';

    if (!isReady) {
      throw new ConflictError(
        `Expense cannot be disbursed until it receives final required approval. Current: ${expense.status}`
      );
    }

    return withTransaction(async (client) => {
      const payableAcc = await LedgerRepository.findAccountByCode(expense.club_id, '2010', client);
      const cashAcc = await LedgerRepository.findAccountByCode(expense.club_id, '1010', client);

      if (payableAcc && cashAcc) {
        await LedgerRepository.createJournalEntry({
          clubId: expense.club_id,
          description: `Disbursement Settlement - Claim #${expense.id.substring(0, 8)} to ${expense.claimant_name}`,
          referenceType: 'EXPENSE_DISBURSEMENT',
          referenceId: expense.id,
          createdByUserId: officerUserId,
          lines: [
            { accountId: payableAcc.id, debitCents: expense.amount_cents, creditCents: 0, description: 'Accounts Payable Cleared' },
            { accountId: cashAcc.id, debitCents: 0, creditCents: expense.amount_cents, description: 'Cash Clearing Disbursed' },
          ],
        }, client);
      }

      return LedgerRepository.updateExpenseStatus(expenseId, {
        status: 'DISBURSED',
        disbursementMethod: 'BANK_TRANSFER',
      }, client);
    }, expense.club_id);
  }
}
