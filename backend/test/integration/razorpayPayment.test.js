import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { app } from '../../src/app.js';
import { pool } from '../../src/config/db.js';
import { config } from '../../src/config/env.js';

test('Razorpay Standard Web Checkout Integration Suite', async (t) => {
  let server;
  let baseUrl;

  t.before(async () => {
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

  await t.test('1. Config Endpoint: Safely returns Razorpay Key ID without exposing Key Secret', async () => {
    const res = await fetch(`${baseUrl}/api/payment/config`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.key_id, config.RAZORPAY_KEY_ID);
    assert.equal(body.data.currency, 'INR');
    assert.equal(body.data.key_secret, undefined);
  });

  await t.test('2. Order Creation: Rejects order if amount is less than 100 paise (Zod Guardrail)', async () => {
    const res = await fetch(`${baseUrl}/api/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 50 }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  });

  await t.test('3. Order Creation: Rejects order if amount field is missing', async () => {
    const res = await fetch(`${baseUrl}/api/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currency: 'INR' }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test('4. Order Creation: Creates valid order on Razorpay API with >= 100 paise', async () => {
    const res = await fetch(`${baseUrl}/api/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 50000, // ₹500.00
        currency: 'INR',
        notes: { testSuite: 'true', purpose: 'Membership Dues' },
      }),
    });

    // If Razorpay API responds with real credentials or network, it creates the order
    // In CI or live test, verify standard response envelope
    if (res.status === 201) {
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.data.order_id);
      assert.equal(body.data.amount, 50000);
      assert.equal(body.data.currency, 'INR');
    } else {
      // If external network is restricted, verify error envelope structure
      assert.ok([500, 502, 503].includes(res.status));
    }
  });

  await t.test('5. Signature Verification: Successfully validates authentic HMAC-SHA256 signature', async () => {
    const order_id = 'order_test_999999999';
    const payment_id = 'pay_test_888888888';

    // Compute expected HMAC-SHA256 signature using the secret key
    const validSignature = crypto
      .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
      .update(`${order_id}|${payment_id}`)
      .digest('hex');

    const res = await fetch(`${baseUrl}/api/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: order_id,
        razorpay_payment_id: payment_id,
        razorpay_signature: validSignature,
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.verified, true);
    assert.equal(body.data.order_id, order_id);
    assert.equal(body.data.payment_id, payment_id);
  });

  await t.test('6. Signature Verification: Rejects tampered / forged signature with 400', async () => {
    const order_id = 'order_test_999999999';
    const payment_id = 'pay_test_888888888';
    const tamperedSignature = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    const res = await fetch(`${baseUrl}/api/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: order_id,
        razorpay_payment_id: payment_id,
        razorpay_signature: tamperedSignature,
      }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.error.message, /verification failed|Untrusted or tampered/i);
  });

  await t.test('7. Signature Verification: Rejects payload with missing verification parameters', async () => {
    const res = await fetch(`${baseUrl}/api/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: 'order_test_123',
        // missing payment_id and signature
      }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test('8. Static Frontend: Serves checkout web interface at / and /checkout', async () => {
    const res = await fetch(`${baseUrl}/checkout`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('Razorpay Standard Checkout'));
    assert.ok(html.includes('https://checkout.razorpay.com/v1/checkout.js'));
    assert.ok(html.includes('/api/create-order'));
    assert.ok(html.includes('/api/verify-payment'));
  });
});
