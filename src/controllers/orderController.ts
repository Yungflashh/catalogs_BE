import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Order } from '../models/Order';
import { Cart } from '../models/Cart';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';
import { notify, formatEvent, nowUtc, clientIp } from '../utils/telegram';

// @desc  Create order (checkout) from cart — digital products, no shipping
// @route POST /api/orders
export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { paymentMethod } = req.body;

  const cart = await Cart.findOne({ user: req.user!._id }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error('Cart is empty');
  }

  // Drop items whose product was deleted (populate returns null). Persist the
  // cleanup so stale refs don't keep breaking future checkouts.
  const originalCount = cart.items.length;
  cart.items = cart.items.filter((i) => i.product);
  if (cart.items.length !== originalCount) {
    await cart.save();
  }
  if (cart.items.length === 0) {
    res.status(400);
    throw new Error('Cart items are no longer available. Please add products again.');
  }

  const items = cart.items.map((i) => {
    const p = i.product as any;
    return {
      product: p._id,
      name: p.name,
      price: p.price,
      quantity: i.quantity,
      image: p.images?.[0] || '',
    };
  });

  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const buyer = await User.findById(req.user!._id);
  if (!buyer || buyer.walletBalance < totalPrice) {
    res.status(400);
    throw new Error(
      `Insufficient wallet balance. Need $${totalPrice.toFixed(2)}, have $${(buyer?.walletBalance ?? 0).toFixed(2)}.`
    );
  }

  for (const i of items) {
    await Product.findByIdAndUpdate(i.product, { $inc: { stock: -i.quantity } });
  }

  const order = await Order.create({
    user: req.user!._id,
    items,
    paymentMethod: paymentMethod || 'Wallet',
    totalPrice,
    status: 'paid',
  });

  await User.findByIdAndUpdate(req.user!._id, { $inc: { walletBalance: -totalPrice } });

  cart.items = [];
  await cart.save();

  logger.info('Order created', {
    orderId: order._id,
    userId: req.user!._id,
    total: totalPrice,
    items: items.length,
  });

  notify(
    formatEvent('✅', 'Order placed', {
      Buyer: `${buyer.name} <${buyer.email}>`,
      Total: `$${totalPrice.toFixed(2)}`,
      Items: items.length,
      Payment: order.paymentMethod,
      OrderId: String(order._id),
      IP: clientIp(req),
      Time: nowUtc(),
    })
  );

  res.status(201).json(order);
});

// @desc  Get my orders (purchase history)
// @route GET /api/orders/mine
export const getMyOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orders = await Order.find({ user: req.user!._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// @desc  Get single order
// @route GET /api/orders/:id
export const getOrderById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  const isOwner = order.user._id
    ? order.user._id.toString() === req.user!._id.toString()
    : order.user.toString() === req.user!._id.toString();
  if (!isOwner && req.user!.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }
  res.json(order);
});

// @desc  Get all orders (admin)
// @route GET /api/orders
export const getAllOrders = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const orders = await Order.find({}).populate('user', 'name email').sort({ createdAt: -1 });
  res.json(orders);
});

// @desc  Update order status (admin)
// @route PUT /api/orders/:id/status
export const updateOrderStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  order.status = req.body.status || order.status;
  const updated = await order.save();
  res.json(updated);
});
