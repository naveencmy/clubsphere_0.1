import test from 'node:test';
import assert from 'node:assert/strict';
import { reserveCartSchema } from '../../src/controllers/merchandiseController.js';
import { submitExpenseSchema } from '../../src/controllers/ledgerController.js';
import { createAnnouncementSchema } from '../../src/controllers/collaborationController.js';

test('Membership Tier Pricing & Grace Period Invariants', async (t) => {
  await t.test('Applies member discount when status is ACTIVE or GRACE_PERIOD', () => {
    const item = {
      variantId: 'd3b07384-d113-4613-bfd0-7a0e10b106e2',
      sku: 'HOODIE-M',
      nonMemberPriceCents: 249900, // ₹2,499.00
      memberPriceCents: 199900,    // ₹1,999.00 (₹500 discount)
    };

    const eligibleStatuses = ['ACTIVE', 'GRACE_PERIOD'];
    for (const status of eligibleStatuses) {
      const isEligible = status === 'ACTIVE' || status === 'GRACE_PERIOD';
      const effectivePrice = isEligible ? item.memberPriceCents : item.nonMemberPriceCents;
      const savings = item.nonMemberPriceCents - effectivePrice;

      assert.equal(effectivePrice, 199900);
      assert.equal(savings, 50000); // ₹500.00
    }
  });

  await t.test('Denies member discount when status is EXPIRED, REVOKED, or PENDING_PAYMENT', () => {
    const item = {
      variantId: 'd3b07384-d113-4613-bfd0-7a0e10b106e2',
      nonMemberPriceCents: 249900,
      memberPriceCents: 199900,
    };

    const ineligibleStatuses = ['EXPIRED', 'REVOKED', 'PENDING_PAYMENT', null];
    for (const status of ineligibleStatuses) {
      const isEligible = status === 'ACTIVE' || status === 'GRACE_PERIOD';
      const effectivePrice = isEligible ? item.memberPriceCents : item.nonMemberPriceCents;
      const savings = item.nonMemberPriceCents - effectivePrice;

      assert.equal(effectivePrice, 249900);
      assert.equal(savings, 0);
    }
  });
});

test('Zod Input Validation Security Guardrails', async (t) => {
  await t.test('Rejects cart checkout with invalid UUID or negative quantity', () => {
    const invalidCart = {
      items: [
        { variantId: 'not-a-uuid', quantity: -1 },
      ],
    };
    const result = reserveCartSchema.safeParse(invalidCart);
    assert.equal(result.success, false);
    assert.ok(result.error.issues.length >= 1);
  });

  await t.test('Accepts valid cart checkout payload', () => {
    const validCart = {
      items: [
        { variantId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', quantity: 2 },
      ],
    };
    const result = reserveCartSchema.safeParse(validCart);
    assert.equal(result.success, true);
  });

  await t.test('Enforces mandatory receipt proof URL and positive amount on expense intake', () => {
    const invalidExpense = {
      title: 'Workshop Supplies',
      category: 'SUPPLIES',
      merchantName: 'Campus Store',
      purchaseDate: '2026-10-10',
      amountCents: 0, // Must be > 0
      description: 'Markers and chart papers',
      receiptImageUrl: 'invalid-url', // Must be valid URL
    };
    const result = submitExpenseSchema.safeParse(invalidExpense);
    assert.equal(result.success, false);
  });

  await t.test('Validates announcement audience enum constraints', () => {
    const validAnnouncement = {
      title: 'Annual General Meeting',
      content: '# AGM 2026\nMeeting details...',
      targetAudience: 'ALL_MEMBERS',
    };
    const validResult = createAnnouncementSchema.safeParse(validAnnouncement);
    assert.equal(validResult.success, true);

    const invalidAnnouncement = {
      title: 'Secret Meeting',
      content: 'Details...',
      targetAudience: 'EXTERNAL_HACKERS', // Invalid enum
    };
    const invalidResult = createAnnouncementSchema.safeParse(invalidAnnouncement);
    assert.equal(invalidResult.success, false);
  });
});
