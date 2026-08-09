import { Router } from 'express';
import {
  createOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus,
} from '../controllers/orderController';
import { protect, admin } from '../middleware/auth';

const router = Router();
router.post('/', protect, createOrder);
router.get('/mine', protect, getMyOrders);
router.get('/', protect, admin, getAllOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, admin, updateOrderStatus);
export default router;
