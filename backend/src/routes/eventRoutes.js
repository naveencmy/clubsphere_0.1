import { Router } from 'express';
import {
  EventController,
  reserveTicketSchema,
  confirmTicketPaymentSchema,
  checkInSchema,
} from '../controllers/eventController.js';
import { validate } from '../middleware/validate.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requireClubTenant, authorizeRole } from '../middleware/rbac.js';

const router = Router();

router.use(requireClubTenant);

router.get('/', EventController.getEvents);
router.get('/:eventId', optionalAuth, EventController.getEventDetails);
router.post('/:eventId/reserve', authenticate, validate({ body: reserveTicketSchema }), EventController.reserveTicket);
router.post('/tickets/:ticketId/confirm', validate({ body: confirmTicketPaymentSchema }), EventController.confirmPayment);
router.post(
  '/:eventId/check-in',
  authenticate,
  authorizeRole(['VOLUNTEER', 'COMMITTEE_LEAD', 'TREASURER', 'ASSOCIATION_COORDINATOR', 'ASSOCIATION_INCHARGE', 'ADMIN']),
  validate({ body: checkInSchema }),
  EventController.checkIn
);
router.get(
  '/:eventId/reconciliation',
  authenticate,
  authorizeRole(['TREASURER', 'ASSOCIATION_COORDINATOR', 'ASSOCIATION_INCHARGE', 'ADMIN']),
  EventController.getReconciliation
);

export default router;
