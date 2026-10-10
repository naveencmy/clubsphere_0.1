import { z } from 'zod';
import { MerchandiseService } from '../services/merchandiseService.js';
import { sendSuccess } from '../utils/response.js';

export const reserveCartSchema = z.object({
  items: z.array(
    z.object({
      variantId: z.string().uuid('Invalid variant ID format'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    })
  ).min(1, 'Cart cannot be empty'),
});

export const paymentWebhookSchema = z.object({
  orderId: z.string().uuid(),
  stripePaymentIntentId: z.string().optional(),
});

export const returnInspectionSchema = z.object({
  condition: z.enum(['SELLABLE', 'DAMAGED']).default('SELLABLE'),
});

export class MerchandiseController {
  static async getCatalog(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null;
      const catalog = await MerchandiseService.getCatalog(req.clubId, userId);
      return sendSuccess(res, catalog, 'Merchandise catalog retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async reserveCheckout(req, res, next) {
    try {
      const reservation = await MerchandiseService.reserveCheckout({
        clubId: req.clubId,
        userId: req.user.id,
        items: req.body.items,
      });
      return sendSuccess(res, reservation, 'Cart items reserved for 10 minutes', 201);
    } catch (err) {
      next(err);
    }
  }

  static async handlePaymentWebhook(req, res, next) {
    try {
      const { orderId, stripePaymentIntentId } = req.body;
      const settledOrder = await MerchandiseService.handlePaymentSuccess(orderId, stripePaymentIntentId);
      return sendSuccess(res, settledOrder, 'Order settled and stock decremented');
    } catch (err) {
      next(err);
    }
  }

  static async cancelOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      const cancelledOrder = await MerchandiseService.cancelOrderBeforePickup(orderId);
      return sendSuccess(res, cancelledOrder, 'Order cancelled and stock restored');
    } catch (err) {
      next(err);
    }
  }

  static async returnOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      const { condition } = req.body;
      const refundedOrder = await MerchandiseService.returnMerchandiseOrder(orderId, { condition });
      return sendSuccess(res, refundedOrder, `Return processed with condition: ${condition}`);
    } catch (err) {
      next(err);
    }
  }
}
