import { Router } from 'express';
import {
  LedgerController,
  createJournalEntrySchema,
  submitExpenseSchema,
  requestCorrectionSchema,
  rejectExpenseSchema,
  resubmitExpenseSchema,
} from '../controllers/ledgerController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requireClubTenant, authorizeRole } from '../middleware/rbac.js';

const router = Router();

router.use(requireClubTenant);

// General Ledger & Accounts
router.get('/accounts', authenticate, LedgerController.getAccounts);
router.get('/journal-entries', authenticate, authorizeRole(['TREASURER', 'PRESIDENT', 'ADMIN']), LedgerController.getJournalEntries);
router.post(
  '/journal-entries',
  authenticate,
  authorizeRole(['TREASURER', 'ADMIN']),
  validate({ body: createJournalEntrySchema }),
  LedgerController.createJournalEntry
);

// Budgets & Treasurer Reporting
router.get('/budgets', authenticate, LedgerController.getBudgets);
router.get('/treasurer/summary', authenticate, authorizeRole(['TREASURER', 'PRESIDENT', 'ADMIN']), LedgerController.getTreasurerSummary);

// Expense Reimbursement Workflow
router.get('/expenses', authenticate, LedgerController.getExpenses);
router.get('/expenses/:id', authenticate, LedgerController.getExpenseDetails);
router.post(
  '/expenses',
  authenticate,
  validate({ body: submitExpenseSchema }),
  LedgerController.submitExpense
);
router.post(
  '/expenses/:id/review',
  authenticate,
  authorizeRole(['TREASURER', 'PRESIDENT', 'ADMIN']),
  LedgerController.reviewExpense
);
router.post(
  '/expenses/:id/request-correction',
  authenticate,
  authorizeRole(['TREASURER', 'PRESIDENT', 'ADMIN']),
  validate({ body: requestCorrectionSchema }),
  LedgerController.requestCorrection
);
router.put(
  '/expenses/:id/resubmit',
  authenticate,
  validate({ body: resubmitExpenseSchema }),
  LedgerController.resubmitExpense
);
router.post(
  '/expenses/:id/reject',
  authenticate,
  authorizeRole(['TREASURER', 'PRESIDENT', 'ADMIN']),
  validate({ body: rejectExpenseSchema }),
  LedgerController.rejectExpense
);
router.post(
  '/expenses/:id/approve-treasurer',
  authenticate,
  authorizeRole(['TREASURER', 'ADMIN']),
  LedgerController.approveByTreasurer
);
router.post(
  '/expenses/:id/approve-president',
  authenticate,
  authorizeRole(['PRESIDENT', 'ADMIN']),
  LedgerController.approveByPresident
);
router.post(
  '/expenses/:id/disburse',
  authenticate,
  authorizeRole(['TREASURER', 'ADMIN']),
  LedgerController.disburseExpense
);

export default router;
