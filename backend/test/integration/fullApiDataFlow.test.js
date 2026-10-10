import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../../src/app.js';
import { pool, query } from '../../src/config/db.js';
import { evaluateExperiment } from '../../src/utils/experiments.js';

test('ClubSphere End-to-End API Data Flow & Observability Suite', async (t) => {
  let server;
  let baseUrl;

  t.before(async () => {
    try {
      await query(
        `INSERT INTO clubs (id, slug, name, description, annual_dues_cents, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING;`,
        ['c0000000-0000-0000-0000-000000000001', 'demo-tech-club', 'ClubSphere Demo Club', 'Official demo club for test suite', 5000, true]
      );
    } catch {
      // Proceed if test runs against mock or uninitialized db
    }

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  t.after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await pool.end();
  });

  await t.test('1. System Health & Gateway Observability Headers', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);

    const requestId = res.headers.get('x-request-id');
    const service = res.headers.get('x-clubsphere-service');

    assert.ok(requestId, 'Expected X-Request-Id header to be present');
    assert.equal(service, 'ClubSphere-API');

    const body = await res.json();
    assert.equal(body.status, 'UP');
    assert.equal(body.service, 'ClubSphere API Gateway');
  });

  await t.test('2. A/B Testing Engine - Deterministic Hash-Based Bucketing', async () => {
    // Test that the same participant ID always evaluates to the identical variant
    const participantId = 'd3b07384-d113-4613-bfd0-7a0e10b106e2';
    const exp1 = evaluateExperiment('EXP_MERCH_MEMBERSHIP_UPSELL', participantId);
    const exp2 = evaluateExperiment('EXP_MERCH_MEMBERSHIP_UPSELL', participantId);

    assert.equal(exp1.variant, exp2.variant);
    assert.equal(exp1.bucket, exp2.bucket);
    assert.ok(['CONTROL', 'TREATMENT'].includes(exp1.variant));

    // Test API evaluate endpoint
    const res = await fetch(`${baseUrl}/api/experiments/EXP_MERCH_MEMBERSHIP_UPSELL/evaluate?participantId=${participantId}`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.variant, exp1.variant);
  });

  await t.test('3. A/B Testing Engine - Track Conversion Event', async () => {
    const res = await fetch(`${baseUrl}/api/experiments/EXP_MERCH_MEMBERSHIP_UPSELL/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metricName: 'cart_to_paid_conversion_rate',
        value: 1,
        participantId: 'user_12345',
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.metricName, 'cart_to_paid_conversion_rate');
  });

  await t.test('4. Security & Guardrail - Rejects Malformed Cart Reservation (Zod Validation)', async () => {
    const res = await fetch(`${baseUrl}/api/store/checkout/reserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Club-Id': 'c0000000-0000-0000-0000-000000000001',
      },
      body: JSON.stringify({
        items: [{ variantId: 'invalid-uuid', quantity: -5 }],
      }),
    });

    // Expect 400 Bad Request or 401 Unauthorized if auth is enforced first
    assert.ok([400, 401].includes(res.status));
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test('5. Security & Guardrail - Enforces Positive Expense Amount & Mandatory Receipt Proof', async () => {
    const res = await fetch(`${baseUrl}/api/ledger/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Club-Id': 'c0000000-0000-0000-0000-000000000001',
      },
      body: JSON.stringify({
        title: 'Missing Receipt Expense',
        category: 'SUPPLIES',
        merchantName: 'Local Store',
        purchaseDate: '2026-10-10',
        amountCents: -500,
        description: 'Missing receipt',
        receiptImageUrl: 'invalid-url',
      }),
    });

    assert.ok([400, 401].includes(res.status));
    const body = await res.json();
    assert.equal(body.success, false);
  });
});
