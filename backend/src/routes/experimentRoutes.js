import { Router } from 'express';
import { ExperimentController } from '../controllers/experimentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', ExperimentController.listExperiments);
router.get('/:key', ExperimentController.getExperiment);
router.get('/:key/evaluate', ExperimentController.evaluate);
router.post('/:key/track', ExperimentController.trackConversion);

export default router;
