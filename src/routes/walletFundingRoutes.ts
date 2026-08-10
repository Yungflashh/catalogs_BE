import express from 'express';
import {
  createFundingRequest,
  submitProof,
  getMyFundingRequests,
  getAllFundingRequests,
  approveFunding,
  rejectFunding,
  adminAdjustWallet,
} from '../controllers/walletFundingController';
import { protect, admin } from '../middleware/auth';

const router = express.Router();

// User routes
router.post('/', protect, createFundingRequest);
router.get('/mine', protect, getMyFundingRequests);
router.put('/:id/proof', protect, submitProof);

// Admin routes
router.get('/', protect, admin, getAllFundingRequests);
router.put('/:id/approve', protect, admin, approveFunding);
router.put('/:id/reject', protect, admin, rejectFunding);
router.post('/adjust', protect, admin, adminAdjustWallet);

export default router;
