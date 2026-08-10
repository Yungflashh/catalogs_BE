import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { WalletFunding } from '../models/WalletFunding';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

// @route POST /api/wallet-funding — user creates a funding request
export const createFundingRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { amount, cryptoWalletId } = req.body;
  if (!amount || Number(amount) < 1) {
    res.status(400);
    throw new Error('Amount must be at least $1');
  }
  if (!cryptoWalletId) {
    res.status(400);
    throw new Error('Please select a crypto wallet');
  }

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const funding = await WalletFunding.create({
    user: req.user!._id,
    amount: Number(amount),
    cryptoWallet: cryptoWalletId,
    expiresAt,
  });

  const populated = await funding.populate('cryptoWallet');
  logger.info('Wallet funding request created', {
    fundingId: funding._id,
    userId: req.user!._id,
    amount,
    expiresAt,
  });
  res.status(201).json(populated);
});

// @route PUT /api/wallet-funding/:id/proof — user submits payment proof
export const submitProof = asyncHandler(async (req: AuthRequest, res: Response) => {
  const funding = await WalletFunding.findById(req.params.id);
  if (!funding) {
    res.status(404);
    throw new Error('Funding request not found');
  }
  if (funding.user.toString() !== req.user!._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }
  if (funding.status !== 'pending') {
    res.status(400);
    throw new Error('Request is no longer pending');
  }
  if (new Date() > funding.expiresAt) {
    res.status(400);
    throw new Error('Funding request has expired');
  }
  const { proofImage } = req.body;
  if (!proofImage) {
    res.status(400);
    throw new Error('Proof image URL is required');
  }
  funding.proofImage = proofImage;
  const updated = await funding.save();
  await updated.populate('cryptoWallet');
  res.json(updated);
});

// @route GET /api/wallet-funding/mine — user's own requests
export const getMyFundingRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const requests = await WalletFunding.find({ user: req.user!._id })
    .populate('cryptoWallet')
    .sort({ createdAt: -1 });
  res.json(requests);
});

// @route GET /api/wallet-funding — admin: all requests
export const getAllFundingRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;
  const requests = await WalletFunding.find(filter)
    .populate('user', 'name email walletBalance')
    .populate('cryptoWallet')
    .sort({ createdAt: -1 });
  res.json(requests);
});

// @route PUT /api/wallet-funding/:id/approve — admin approves, credits wallet
export const approveFunding = asyncHandler(async (req: AuthRequest, res: Response) => {
  const funding = await WalletFunding.findById(req.params.id);
  if (!funding) {
    res.status(404);
    throw new Error('Funding request not found');
  }
  if (funding.status !== 'pending') {
    res.status(400);
    throw new Error('Request is already processed');
  }
  funding.status = 'approved';
  await funding.save();
  await User.findByIdAndUpdate(funding.user, { $inc: { walletBalance: funding.amount } });
  await funding.populate(['user', 'cryptoWallet']);
  logger.info('Wallet funding approved', {
    fundingId: funding._id,
    userId: funding.user,
    amount: funding.amount,
    approvedBy: req.user!._id,
  });
  res.json(funding);
});

// @route PUT /api/wallet-funding/:id/reject — admin rejects
export const rejectFunding = asyncHandler(async (req: AuthRequest, res: Response) => {
  const funding = await WalletFunding.findById(req.params.id);
  if (!funding) {
    res.status(404);
    throw new Error('Funding request not found');
  }
  if (funding.status !== 'pending') {
    res.status(400);
    throw new Error('Request is already processed');
  }
  funding.status = 'rejected';
  if (req.body.adminNote) funding.adminNote = req.body.adminNote;
  await funding.save();
  await funding.populate(['user', 'cryptoWallet']);
  res.json(funding);
});

// @route POST /api/wallet-funding/adjust — admin manually credits or debits a user wallet
export const adminAdjustWallet = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, amount } = req.body;
  if (!userId || amount === undefined || Number(amount) === 0) {
    res.status(400);
    throw new Error('userId and a non-zero amount are required');
  }
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const delta = Number(amount);
  if (delta < 0 && user.walletBalance + delta < 0) {
    res.status(400);
    throw new Error(`Debit of $${Math.abs(delta).toFixed(2)} exceeds balance of $${user.walletBalance.toFixed(2)}`);
  }
  user.walletBalance = Math.max(0, user.walletBalance + delta);
  await user.save();
  logger.info('Manual wallet adjustment', {
    targetUser: user._id,
    delta,
    newBalance: user.walletBalance,
    adjustedBy: req.user!._id,
  });
  res.json({ _id: user._id, name: user.name, email: user.email, walletBalance: user.walletBalance });
});
