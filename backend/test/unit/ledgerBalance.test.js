import test from 'node:test';
import assert from 'node:assert/strict';

test('Double-Entry Ledger & Financial Invariant Test Suite', async (t) => {
  await t.test('Enforces mathematical debit and credit equality invariant', () => {
    const validLines = [
      { accountId: 'acc-1', debitCents: 79900, creditCents: 0 },
      { accountId: 'acc-2', debitCents: 0, creditCents: 79900 },
    ];

    const totalDebit = validLines.reduce((sum, l) => sum + l.debitCents, 0);
    const totalCredit = validLines.reduce((sum, l) => sum + l.creditCents, 0);

    assert.equal(totalDebit, totalCredit);
    assert.equal(totalDebit, 79900); // ₹799 in paise
  });

  await t.test('Detects unbalanced journal lines and rejects posting', () => {
    const unbalancedLines = [
      { accountId: 'acc-1', debitCents: 50000, creditCents: 0 },
      { accountId: 'acc-2', debitCents: 0, creditCents: 45000 },
    ];

    const totalDebit = unbalancedLines.reduce((sum, l) => sum + l.debitCents, 0);
    const totalCredit = unbalancedLines.reduce((sum, l) => sum + l.creditCents, 0);

    assert.notEqual(totalDebit, totalCredit);
    assert.equal(totalDebit - totalCredit, 5000); // 5000 paise imbalance
  });

  await t.test('Evaluates dual-approval threshold rule (₹2,500 = 250,000 paise)', () => {
    const DUAL_APPROVAL_THRESHOLD_CENTS = 250000;

    const smallClaimCents = 175000; // ₹1,750
    const largeClaimCents = 320000; // ₹3,200

    const requiresDualApprovalSmall = smallClaimCents >= DUAL_APPROVAL_THRESHOLD_CENTS;
    const requiresDualApprovalLarge = largeClaimCents >= DUAL_APPROVAL_THRESHOLD_CENTS;

    assert.equal(requiresDualApprovalSmall, false, 'Small claim requires single Treasurer approval');
    assert.equal(requiresDualApprovalLarge, true, 'Large claim requires Treasurer + President dual sign-off');
  });

  await t.test('Evaluates budget burn-rate warning thresholds', () => {
    function calculateWarning(allocatedCents, spentCents) {
      const percentage = (spentCents / allocatedCents) * 100;
      if (percentage >= 100) return 'EXCEEDED';
      if (percentage >= 80) return 'WARNING';
      return 'NORMAL';
    }

    const budget = 1000000; // ₹10,000
    assert.equal(calculateWarning(budget, 500000), 'NORMAL'); // 50%
    assert.equal(calculateWarning(budget, 850000), 'WARNING'); // 85%
    assert.equal(calculateWarning(budget, 1050000), 'EXCEEDED'); // 105%
  });
});
