import { Router } from 'express';
import { trackVisit } from '../controllers/trackController';

const router = Router();

router.post('/visit', trackVisit);

export default router;
