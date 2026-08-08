import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Cart } from '../models/Cart';
import { AuthRequest } from '../middleware/auth';

const getPopulatedCart = async (userId: string) => {
  let cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
    cart = await cart.populate('items.product');
  }
  return cart;
};

// @desc  Get cart
// @route GET /api/cart
export const getCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cart = await getPopulatedCart(req.user!._id.toString());
  res.json(cart);
});

// @desc  Add / update item in cart
// @route POST /api/cart
export const addToCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId, quantity } = req.body;
  const qty = Number(quantity) || 1;

  let cart = await Cart.findOne({ user: req.user!._id });
  if (!cart) cart = await Cart.create({ user: req.user!._id, items: [] });

  const existing = cart.items.find((i) => i.product.toString() === productId);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.items.push({ product: productId, quantity: qty });
  }
  await cart.save();
  const populated = await getPopulatedCart(req.user!._id.toString());
  res.status(201).json(populated);
});

// @desc  Set item quantity
// @route PUT /api/cart/:productId
export const updateCartItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { quantity } = req.body;
  const cart = await Cart.findOne({ user: req.user!._id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }
  const item = cart.items.find((i) => i.product.toString() === req.params.productId);
  if (!item) {
    res.status(404);
    throw new Error('Item not in cart');
  }
  item.quantity = Math.max(1, Number(quantity));
  await cart.save();
  const populated = await getPopulatedCart(req.user!._id.toString());
  res.json(populated);
});

// @desc  Remove item
// @route DELETE /api/cart/:productId
export const removeCartItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cart = await Cart.findOne({ user: req.user!._id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }
  cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  await cart.save();
  const populated = await getPopulatedCart(req.user!._id.toString());
  res.json(populated);
});

// @desc  Clear cart
// @route DELETE /api/cart
export const clearCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cart = await Cart.findOne({ user: req.user!._id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  res.json({ user: req.user!._id, items: [] });
});
