import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { config } from '../config/env.js';

/**
 * Hash a plain password using bcrypt.
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a plain password against stored hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generates an HMAC-SHA256 digital signature for rotating QR codes.
 * Format: HMAC_SHA256(secret, `${payload}:${timestamp}:${nonce}`)
 * 
 * @param {string} payload - e.g. ticketCode or membershipId
 * @param {number} timestamp - Epoch seconds
 * @param {string} nonce - Random cryptographic string
 * @param {string} [secret=config.QR_SIGNING_SECRET]
 * @returns {string}
 */
export function generateQrSignature(payload, timestamp, nonce, secret = config.QR_SIGNING_SECRET) {
  const message = `${payload}:${timestamp}:${nonce}`;
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

/**
 * Validates rotating QR code payload and HMAC signature.
 * Enforces maximum time drift window (default 120 seconds to prevent replay attacks).
 * 
 * @param {string} payload
 * @param {number} timestamp - Epoch seconds from QR scan
 * @param {string} nonce
 * @param {string} signature
 * @param {number} [maxDriftSeconds=120]
 * @param {string} [secret=config.QR_SIGNING_SECRET]
 * @returns {{ valid: boolean, error?: string }}
 */
export function verifyQrSignature(payload, timestamp, nonce, signature, maxDriftSeconds = 120, secret = config.QR_SIGNING_SECRET) {
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > maxDriftSeconds) {
    return { valid: false, error: 'QR code expired. Please refresh your digital pass.' };
  }

  const expectedSignature = generateQrSignature(payload, timestamp, nonce, secret);
  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );

  return isValid
    ? { valid: true }
    : { valid: false, error: 'Invalid cryptographic signature. Potential counterfeit.' };
}

/**
 * Computes SHA-256 hash of text or buffer for immutability audit logging.
 * @param {string|Buffer} content
 * @returns {string}
 */
export function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Generates a random alphanumeric code (e.g. TCK-8942-XF91 or PKP-4829).
 * @param {string} prefix
 * @returns {string}
 */
export function generateReferenceCode(prefix = 'REF') {
  const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${part1}-${part2}`;
}
