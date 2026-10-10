import { Router } from 'express';
import {
  CollaborationController,
  createAnnouncementSchema,
  editAnnouncementSchema,
  createFundraiserSchema,
  createTaskSchema,
  updateTaskStatusSchema,
} from '../controllers/collaborationController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requireClubTenant, authorizeRole } from '../middleware/rbac.js';

const router = Router();

router.use(requireClubTenant);

// Announcements
router.get('/announcements', CollaborationController.getAnnouncements);
router.post(
  '/announcements',
  authenticate,
  authorizeRole(['COMMITTEE_LEAD', 'TREASURER', 'ASSOCIATION_COORDINATOR', 'ASSOCIATION_INCHARGE', 'ADMIN']),
  validate({ body: createAnnouncementSchema }),
  CollaborationController.publishAnnouncement
);
router.put(
  '/announcements/:id',
  authenticate,
  authorizeRole(['COMMITTEE_LEAD', 'TREASURER', 'ASSOCIATION_COORDINATOR', 'ASSOCIATION_INCHARGE', 'ADMIN']),
  validate({ body: editAnnouncementSchema }),
  CollaborationController.editAnnouncement
);
router.get('/announcements/:id/history', CollaborationController.getAnnouncementHistory);
router.post('/announcements/:id/read', authenticate, CollaborationController.markAnnouncementRead);

// Fundraisers
router.get('/fundraisers', CollaborationController.getFundraisers);
router.post(
  '/fundraisers',
  authenticate,
  authorizeRole(['COMMITTEE_LEAD', 'TREASURER', 'ASSOCIATION_COORDINATOR', 'ASSOCIATION_INCHARGE', 'ADMIN']),
  validate({ body: createFundraiserSchema }),
  CollaborationController.createFundraiser
);

// Kanban Tasks
router.get('/tasks', CollaborationController.getTasks);
router.post(
  '/tasks',
  authenticate,
  authorizeRole(['VOLUNTEER', 'COMMITTEE_LEAD', 'TREASURER', 'ASSOCIATION_COORDINATOR', 'ASSOCIATION_INCHARGE', 'ADMIN']),
  validate({ body: createTaskSchema }),
  CollaborationController.createTask
);
router.patch(
  '/tasks/:taskId/status',
  authenticate,
  validate({ body: updateTaskStatusSchema }),
  CollaborationController.updateTaskStatus
);

// Volunteer Shifts
router.get('/shifts', CollaborationController.getShifts);
router.post('/shifts/:shiftId/claim', authenticate, CollaborationController.claimShift);

export default router;
