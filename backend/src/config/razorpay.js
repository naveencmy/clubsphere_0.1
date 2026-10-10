import Razorpay from 'razorpay';
import { config } from './env.js';

/**
 * Singleton instance of Razorpay SDK Client.
 * Initialized with environment credentials.
 */
export const razorpayClient = new Razorpay({
  key_id: config.RAZORPAY_KEY_ID,
  key_secret: config.RAZORPAY_KEY_SECRET,
});
