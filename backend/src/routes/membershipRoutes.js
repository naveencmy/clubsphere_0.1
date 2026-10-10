import { Router } from 'express';
import { MembershipController, registerMembershipSchema, verifyPassSchema } from '../controllers/membershipController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requireClubTenant, authorizeRole } from '../middleware/rbac.js';

const router = Router();

router.use(requireClubTenant);

router.post('/register', authenticate, validate({ body: registerMembershipSchema }), MembershipController.register);
router.get('/pass', authenticate, MembershipController.getRotatingPass);
router.post('/verify-pass', authenticate, authorizeRole(['OFFICER', 'TREASURER', 'PRESIDENT', 'ADMIN']), validate({ body: verifyPassSchema }), MembershipController.verifyPass);
router.post('/cron/check-expirations', authenticate, authorizeRole(['ADMIN']), MembershipController.runExpirationJob);

export default router;
