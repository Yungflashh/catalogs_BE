import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { CryptoWallet } from '../models/CryptoWallet';
import { AuthRequest } from '../middleware/auth';

// @route GET /api/crypto-wallets — active wallets (public, for fund-wallet page)
export const getActiveCryptoWallets = asyncHandler(async (_req, res: Response) => {
  const wallets = await CryptoWallet.find({ isActive: true }).sort({ name: 1 });
  res.json(wallets);
});

// @route GET /api/crypto-wallets/all — all wallets (admin)
export const getAllCryptoWallets = asyncHandler(async (_req, res: Response) => {
  const wallets = await CryptoWallet.find({}).sort({ createdAt: -1 });
  res.json(wallets);
});

// @route POST /api/crypto-wallets (admin)
export const createCryptoWallet = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, symbol, address, network } = req.body;
  if (!name || !symbol || !address) {
    res.status(400);
    throw new Error('name, symbol, and address are required');
  }
  const wallet = await CryptoWallet.create({ name, symbol, address, network });
  res.status(201).json(wallet);
});

// @route PUT /api/crypto-wallets/:id (admin)
export const updateCryptoWallet = asyncHandler(async (req: AuthRequest, res: Response) => {
  const wallet = await CryptoWallet.findById(req.params.id);
  if (!wallet) {
    res.status(404);
    throw new Error('Crypto wallet not found');
  }
  const { name, symbol, address, network, isActive } = req.body;
  if (name !== undefined) wallet.name = name;
  if (symbol !== undefined) wallet.symbol = symbol;
  if (address !== undefined) wallet.address = address;
  if (network !== undefined) wallet.network = network;
  if (isActive !== undefined) wallet.isActive = isActive;
  const updated = await wallet.save();
  res.json(updated);
});

// @route DELETE /api/crypto-wallets/:id (admin)
export const deleteCryptoWallet = asyncHandler(async (req: AuthRequest, res: Response) => {
  const wallet = await CryptoWallet.findById(req.params.id);
  if (!wallet) {
    res.status(404);
    throw new Error('Crypto wallet not found');
  }
  await wallet.deleteOne();
  res.json({ message: 'Wallet removed' });
});
