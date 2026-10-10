import { Router } from 'express';
import {
  PaymentController,
  createOrderSchema,
  verifyPaymentSchema,
} from '../controllers/paymentController.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Public config endpoint for frontend SDK integration
router.get('/config', PaymentController.getConfig);

// Standard payment checkout endpoints
router.post('/create-order', validate({ body: createOrderSchema }), PaymentController.createOrder);
router.post('/verify-payment', validate({ body: verifyPaymentSchema }), PaymentController.verifyPayment);
router.post('/record-manual', PaymentController.recordManualPayment);
router.post('/manual', PaymentController.recordManualPayment);

export default router;
