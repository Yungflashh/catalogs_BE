import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { User, IUser } from '../models/User';
import { generateToken } from '../utils/generateToken';
import { AuthRequest } from '../middleware/auth';

const userPayload = (user: IUser, token?: string) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  walletBalance: user.walletBalance,
  createdAt: user.createdAt,
  ...(token ? { token } : {}),
});

// @desc  Register new user
// @route POST /api/auth/register
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email and password');
  }

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id.toString());
  res.status(201).json(userPayload(user, token));
});

// @desc  Login user
// @route POST /api/auth/login
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    const token = generateToken(user._id.toString());
    res.json(userPayload(user, token));
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc  Get current profile
// @route GET /api/auth/profile
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json(userPayload(req.user));
});

// @desc  Update profile
// @route PUT /api/auth/profile
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  if (req.body.password) user.password = req.body.password;

  const updated = await user.save();
  const token = generateToken(updated._id.toString());
  res.json(userPayload(updated, token));
});
