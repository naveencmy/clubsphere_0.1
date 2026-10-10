import test from 'node:test';
import assert from 'node:assert/strict';
import { generateQrSignature, verifyQrSignature, sha256, generateReferenceCode } from '../../src/utils/crypto.js';

test('Cryptographic Utilities Test Suite', async (t) => {
  await t.test('generateQrSignature produces consistent HMAC-SHA256 signature', () => {
    const payload = 'TCK-8942-XF91';
    const timestamp = 1775800000;
    const nonce = 'a1b2c3d4';
    const secret = 'test-secret';

    const sig1 = generateQrSignature(payload, timestamp, nonce, secret);
    const sig2 = generateQrSignature(payload, timestamp, nonce, secret);

    assert.equal(sig1, sig2);
    assert.equal(sig1.length, 64); // Hex sha256 length
  });

  await t.test('verifyQrSignature validates timestamp within allowed drift window', () => {
    const payload = 'TCK-8942-XF91';
    const now = Math.floor(Date.now() / 1000);
    const nonce = 'testnonce';
    const secret = 'test-secret';

    const signature = generateQrSignature(payload, now, nonce, secret);
    const result = verifyQrSignature(payload, now, nonce, signature, 120, secret);

    assert.equal(result.valid, true);
  });

  await t.test('verifyQrSignature rejects timestamp outside drift window (replay protection)', () => {
    const payload = 'TCK-8942-XF91';
    const oldTimestamp = Math.floor(Date.now() / 1000) - 200; // 200s ago (> 120s)
    const nonce = 'testnonce';
    const secret = 'test-secret';

    const signature = generateQrSignature(payload, oldTimestamp, nonce, secret);
    const result = verifyQrSignature(payload, oldTimestamp, nonce, signature, 120, secret);

    assert.equal(result.valid, false);
    assert.match(result.error, /QR code expired/i);
  });

  await t.test('sha256 computes consistent hash for content immutability', () => {
    const text = 'Important Campus Announcement';
    const hash1 = sha256(text);
    const hash2 = sha256(text);

    assert.equal(hash1, hash2);
    assert.equal(hash1.length, 64);
  });

  await t.test('generateReferenceCode produces formatted codes with prefixes', () => {
    const ticketCode = generateReferenceCode('TCK');
    const pickupCode = generateReferenceCode('PKP');

    assert.match(ticketCode, /^TCK-[A-F0-9]{4}-[A-F0-9]{4}$/);
    assert.match(pickupCode, /^PKP-[A-F0-9]{4}-[A-F0-9]{4}$/);
  });
});
