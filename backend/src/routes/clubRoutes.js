import { Router } from 'express';
import { ClubController } from '../controllers/clubController.js';

const router = Router();

router.get('/', ClubController.listClubs);
router.get('/slug/:slug', ClubController.getClubBySlug);
router.get('/:id', ClubController.getClubById);

export default router;
