import { Router } from 'express';
import {
  getCart, addToCart, updateCartItem, removeCartItem, clearCart,
} from '../controllers/cartController';
import { protect } from '../middleware/auth';

const router = Router();
router.use(protect);
router.get('/', getCart);
router.post('/', addToCart);
router.delete('/', clearCart);
router.put('/:productId', updateCartItem);
router.delete('/:productId', removeCartItem);
export default router;
