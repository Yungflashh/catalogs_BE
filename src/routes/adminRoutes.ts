import { Router } from 'express';
import { getStats, getUsers, deleteUser, updateUserRole } from '../controllers/adminController';
import { protect, admin } from '../middleware/auth';

const router = Router();
router.use(protect, admin);
router.get('/stats', getStats);
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/role', updateUserRole);
export default router;
