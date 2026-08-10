import express from 'express';
import {
  getActiveCryptoWallets,
  getAllCryptoWallets,
  createCryptoWallet,
  updateCryptoWallet,
  deleteCryptoWallet,
} from '../controllers/cryptoWalletController';
import { protect, admin } from '../middleware/auth';

const router = express.Router();

router.get('/', getActiveCryptoWallets);
router.get('/all', protect, admin, getAllCryptoWallets);
router.post('/', protect, admin, createCryptoWallet);
router.put('/:id', protect, admin, updateCryptoWallet);
router.delete('/:id', protect, admin, deleteCryptoWallet);

export default router;
