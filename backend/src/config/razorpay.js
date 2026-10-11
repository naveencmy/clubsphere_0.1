import Razorpay from 'razorpay';
import { config } from './env.js';

/**
 * Singleton instance of Razorpay SDK Client.
 * Initialized with environment credentials.
 * If credentials are empty, the client will fail on upstream calls
 * and the PaymentService will gracefully fall back to Campus Gateway.
 */
export const razorpayClient = new Razorpay({
  key_id: config.RAZORPAY_KEY_ID || 'rzp_placeholder',
  key_secret: config.RAZORPAY_KEY_SECRET || 'placeholder_secret',
});

/** Whether real Razorpay credentials have been configured */
export const hasRazorpayCredentials =
  !!config.RAZORPAY_KEY_ID &&
  !!config.RAZORPAY_KEY_SECRET &&
  !config.RAZORPAY_KEY_ID.includes('placeholder') &&
  config.RAZORPAY_KEY_ID.startsWith('rzp_');
