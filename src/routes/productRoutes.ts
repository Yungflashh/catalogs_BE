import { Router } from 'express';
import {
  getProducts, getProductById, getSimilarProducts, createProduct, updateProduct,
  deleteProduct, getCategories, getFeatured,
} from '../controllers/productController';
import { protect, admin } from '../middleware/auth';

const router = Router();
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/featured', getFeatured);
router.get('/:id/similar', getSimilarProducts);
router.get('/:id', getProductById);
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);
export default router;
