import { Router } from 'express';
import { ClubController } from '../controllers/clubController.js';

const router = Router();

router.get('/', ClubController.listClubs);
router.get('/slug/:slug', ClubController.getClubBySlug);
router.get('/slug/:slug/members', ClubController.getClubMembers);
router.get('/:id', ClubController.getClubById);
router.get('/:id/members', ClubController.getClubMembers);

export default router;
