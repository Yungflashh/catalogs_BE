import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Wishlist } from '../models/Wishlist';
import { AuthRequest } from '../middleware/auth';

const getPopulated = async (userId: string) => {
  let wl = await Wishlist.findOne({ user: userId }).populate('products');
  if (!wl) {
    wl = await Wishlist.create({ user: userId, products: [] });
    wl = await wl.populate('products');
  }
  return wl;
};

// @desc  Get wishlist
// @route GET /api/wishlist
export const getWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const wl = await getPopulated(req.user!._id.toString());
  res.json(wl);
});

// @desc  Add to wishlist
// @route POST /api/wishlist
export const addToWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId } = req.body;
  let wl = await Wishlist.findOne({ user: req.user!._id });
  if (!wl) wl = await Wishlist.create({ user: req.user!._id, products: [] });

  if (!wl.products.some((p) => p.toString() === productId)) {
    wl.products.push(productId);
    await wl.save();
  }
  const populated = await getPopulated(req.user!._id.toString());
  res.status(201).json(populated);
});

// @desc  Remove from wishlist
// @route DELETE /api/wishlist/:productId
export const removeFromWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const wl = await Wishlist.findOne({ user: req.user!._id });
  if (!wl) {
    res.status(404);
    throw new Error('Wishlist not found');
  }
  wl.products = wl.products.filter((p) => p.toString() !== req.params.productId);
  await wl.save();
  const populated = await getPopulated(req.user!._id.toString());
  res.json(populated);
});
