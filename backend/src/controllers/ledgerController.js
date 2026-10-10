import { z } from 'zod';
import { LedgerService } from '../services/ledgerService.js';
import { sendSuccess } from '../utils/response.js';

export const createJournalEntrySchema = z.object({
  description: z.string().min(1, 'Description is required'),
  referenceType: z.string().optional(),
  referenceId: z.string().uuid().optional(),
  lines: z.array(
    z.object({
      accountId: z.string().uuid(),
      debitCents: z.number().int().min(0).default(0),
      creditCents: z.number().int().min(0).default(0),
      description: z.string().optional(),
    })
  ).min(2, 'Journal entry must have at least 2 lines'),
});

export const submitExpenseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.enum(['EVENT_PRODUCTION', 'SUPPLIES', 'FOOD_CATERING', 'MARKETING', 'TRAVEL', 'OTHER']),
  merchantName: z.string().min(1, 'Merchant name is required'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  amountCents: z.number().int().min(1, 'Amount in paise is required'),
  description: z.string().min(1, 'Detailed description is required'),
  receiptImageUrl: z.string().url('A valid receipt image/PDF URL is required'),
  eventId: z.string().uuid().optional(),
  budgetId: z.string().uuid().optional(),
});

export const requestCorrectionSchema = z.object({
  reviewerNotes: z.string().min(1, 'Feedback notes are required'),
});

export const rejectExpenseSchema = z.object({
  rejectionReason: z.string().min(1, 'Rejection reason is required'),
});

export const resubmitExpenseSchema = z.object({
  title: z.string().optional(),
  amountCents: z.number().int().min(1).optional(),
  description: z.string().optional(),
  receiptImageUrl: z.string().url().optional(),
});

export class LedgerController {
  static async getAccounts(req, res, next) {
    try {
      const accounts = await LedgerService.getAccounts(req.clubId);
      return sendSuccess(res, accounts, 'Chart of accounts retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async createJournalEntry(req, res, next) {
    try {
      const entry = await LedgerService.recordJournalEntry({
        clubId: req.clubId,
        createdByUserId: req.user.id,
        ...req.body,
      });
      return sendSuccess(res, entry, 'Balanced journal entry posted', 201);
    } catch (err) {
      next(err);
    }
  }

  static async getJournalEntries(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 50;
      const entries = await LedgerService.getJournalEntries(req.clubId, limit);
      return sendSuccess(res, entries, 'Journal entries retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getBudgets(req, res, next) {
    try {
      const fiscalYear = req.query.fiscalYear || '2025-2026';
      const budgets = await LedgerService.getBudgetsAndVariance(req.clubId, fiscalYear);
      return sendSuccess(res, budgets, 'Budgets and variance calculations retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getTreasurerSummary(req, res, next) {
    try {
      const summary = await LedgerService.getTreasurerSummary(req.clubId);
      return sendSuccess(res, summary, 'Treasurer executive summary retrieved');
    } catch (err) {
      next(err);
    }
  }

  // --- Expenses ---

  static async submitExpense(req, res, next) {
    try {
      const expense = await LedgerService.submitExpense({
        clubId: req.clubId,
        claimantUserId: req.user.id,
        ...req.body,
      });
      return sendSuccess(res, expense, 'Expense claim submitted with receipt proof', 201);
    } catch (err) {
      next(err);
    }
  }

  static async getExpenses(req, res, next) {
    try {
      const status = req.query.status || null;
      const expenses = await LedgerService.getExpenses(req.clubId, status);
      return sendSuccess(res, expenses, 'Expense claims retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getExpenseDetails(req, res, next) {
    try {
      const expense = await LedgerService.getExpenseDetails(req.params.id);
      return sendSuccess(res, expense, 'Expense claim details retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async reviewExpense(req, res, next) {
    try {
      const expense = await LedgerService.reviewExpense(req.params.id);
      return sendSuccess(res, expense, 'Expense claim is now UNDER_REVIEW');
    } catch (err) {
      next(err);
    }
  }

  static async requestCorrection(req, res, next) {
    try {
      const expense = await LedgerService.requestCorrection(req.params.id, req.body.reviewerNotes);
      return sendSuccess(res, expense, 'Correction requested from claimant');
    } catch (err) {
      next(err);
    }
  }

  static async resubmitExpense(req, res, next) {
    try {
      const expense = await LedgerService.resubmitExpense(req.params.id, req.user.id, req.body);
      return sendSuccess(res, expense, 'Expense resubmitted to SUBMITTED status');
    } catch (err) {
      next(err);
    }
  }

  static async rejectExpense(req, res, next) {
    try {
      const expense = await LedgerService.rejectExpense(req.params.id, req.body.rejectionReason);
      return sendSuccess(res, expense, 'Expense claim rejected');
    } catch (err) {
      next(err);
    }
  }

  static async approveByTreasurer(req, res, next) {
    try {
      const expense = await LedgerService.approveByTreasurer(req.params.id, req.user.id);
      return sendSuccess(res, expense, 'Treasurer approval recorded');
    } catch (err) {
      next(err);
    }
  }

  static async approveByPresident(req, res, next) {
    try {
      const expense = await LedgerService.approveByPresident(req.params.id, req.user.id);
      return sendSuccess(res, expense, 'Association In-charge dual sign-off recorded and Stage 1 Accrual posted');
    } catch (err) {
      next(err);
    }
  }

  static async approveByIncharge(req, res, next) {
    return LedgerController.approveByPresident(req, res, next);
  }

  static async disburseExpense(req, res, next) {
    try {
      const expense = await LedgerService.disburseExpense(req.params.id, req.user.id);
      return sendSuccess(res, expense, 'Disbursement executed and Stage 2 settlement posted');
    } catch (err) {
      next(err);
    }
  }
}
