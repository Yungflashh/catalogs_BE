import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { AuthRequest } from '../middleware/auth';
import { sendEmail } from '../utils/mailer';

// @desc  Dashboard stats (admin)
// @route GET /api/admin/stats
export const getStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [users, products, orders] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments(),
  ]);

  const revenueAgg = await Order.aggregate([
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);
  const revenue = revenueAgg[0]?.total || 0;

  const recentOrders = await Order.find({})
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

  const lowStock = await Product.find({ stock: { $lte: 5 } })
    .select('name stock')
    .limit(5);

  res.json({ users, products, orders, revenue, recentOrders, lowStock });
});

// @desc  Get all users (admin)
// @route GET /api/admin/users
export const getUsers = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const users = await User.find({}).select('-password').sort({ createdAt: -1 });
  res.json(users);
});

// @desc  Delete user (admin)
// @route DELETE /api/admin/users/:id
export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role === 'admin') {
    res.status(400);
    throw new Error('Cannot delete an admin account');
  }
  await user.deleteOne();
  res.json({ message: 'User removed' });
});

// @desc  Update user role (admin)
// @route PUT /api/admin/users/:id/role
export const updateUserRole = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.role = req.body.role === 'admin' ? 'admin' : 'user';
  await user.save();
  res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
});

// @desc  Send an email to a user (admin)
// @route POST /api/admin/users/:id/email
export const emailUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { subject, message } = req.body as { subject?: string; message?: string };
  const trimmedSubject = (subject || '').trim();
  const trimmedMessage = (message || '').trim();

  if (!trimmedSubject || !trimmedMessage) {
    res.status(400);
    throw new Error('Subject and message are required');
  }
  if (trimmedSubject.length > 200) {
    res.status(400);
    throw new Error('Subject is too long (max 200 characters)');
  }
  if (trimmedMessage.length > 10000) {
    res.status(400);
    throw new Error('Message is too long (max 10,000 characters)');
  }

  const user = await User.findById(req.params.id).select('name email');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  await sendEmail({ to: user.email, subject: trimmedSubject, text: trimmedMessage });

  res.json({ message: `Email sent to ${user.email}` });
});
