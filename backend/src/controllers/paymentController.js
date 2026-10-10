import { z } from 'zod';
import { PaymentService } from '../services/paymentService.js';
import { sendSuccess } from '../utils/response.js';

export const createOrderSchema = z.object({
  amount: z.number({ required_error: 'Amount in paise is required' })
    .int('Amount must be an integer in paise')
    .min(100, 'Minimum amount is 100 paise (₹1.00)'),
  currency: z.string().default('INR').optional(),
  receipt: z.string().max(40).optional(),
  notes: z.record(z.any()).optional(),
});

export const verifyPaymentSchema = z.object({
  order_id: z.string().optional(),
  payment_id: z.string().optional(),
  signature: z.string().optional(),
  razorpay_order_id: z.string().optional(),
  razorpay_payment_id: z.string().optional(),
  razorpay_signature: z.string().optional(),
}).refine(
  (data) => (data.order_id || data.razorpay_order_id) &&
            (data.payment_id || data.razorpay_payment_id),
  { message: 'order_id and payment_id are required for payment verification.' }
);

export class PaymentController {
  /**
   * POST /api/create-order or /api/payment/create-order
   */
  static async createOrder(req, res, next) {
    try {
      const { amount, currency = 'INR', receipt, notes } = req.body;
      const order = await PaymentService.createOrder({ amount, currency, receipt, notes });
      return sendSuccess(res, order, 'Razorpay order created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/verify-payment or /api/payment/verify-payment
   */
  static async verifyPayment(req, res, next) {
    try {
      const order_id = req.body.order_id || req.body.razorpay_order_id;
      const payment_id = req.body.payment_id || req.body.razorpay_payment_id;
      const signature = req.body.signature || req.body.razorpay_signature;

      const result = PaymentService.verifyPaymentSignature({
        order_id,
        payment_id,
        signature,
      });

      return sendSuccess(res, result, 'Payment signature verified successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payment/record-manual
   * Records Bank Transfer NEFT, University Cash Voucher, or Direct UPI.
   */
  static async recordManualPayment(req, res, next) {
    try {
      const result = await PaymentService.recordManualPayment(req.body);
      return sendSuccess(res, result, 'Manual / voucher payment verified and recorded', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payment/config
   * Safely returns public Razorpay Key ID for frontend SDK initialization.
   */
  static async getConfig(req, res, next) {
    try {
      const publicConfig = await PaymentService.getPublicConfig();
      return sendSuccess(res, publicConfig, 'Payment gateway configuration', 200);
    } catch (error) {
      next(error);
    }
  }
}
