import { Router } from 'express';
import {
  MerchandiseController,
  reserveCartSchema,
  paymentWebhookSchema,
  returnInspectionSchema,
} from '../controllers/merchandiseController.js';
import { validate } from '../middleware/validate.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requireClubTenant, authorizeRole } from '../middleware/rbac.js';

const router = Router();

router.use(requireClubTenant);

router.get('/catalog', optionalAuth, MerchandiseController.getCatalog);
router.post(['/checkout/reserve', '/reserve'], authenticate, validate({ body: reserveCartSchema }), MerchandiseController.reserveCheckout);
router.post(['/webhook/payment-settled', '/webhook/payment-success'], validate({ body: paymentWebhookSchema }), MerchandiseController.handlePaymentWebhook);
router.post('/orders/:orderId/cancel', authenticate, MerchandiseController.cancelOrder);
router.post(
  '/orders/:orderId/return',
  authenticate,
  authorizeRole(['COMMITTEE_LEAD', 'TREASURER', 'ASSOCIATION_COORDINATOR', 'ASSOCIATION_INCHARGE', 'ADMIN']),
  validate({ body: returnInspectionSchema }),
  MerchandiseController.returnOrder
);

export default router;
