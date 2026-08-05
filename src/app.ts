import path from 'path';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { notFound, errorHandler } from './middleware/errorHandler';
import logger from './utils/logger';

import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import cartRoutes from './routes/cartRoutes';
import wishlistRoutes from './routes/wishlistRoutes';
import orderRoutes from './routes/orderRoutes';
import adminRoutes from './routes/adminRoutes';
import uploadRoutes from './routes/uploadRoutes';
import cryptoWalletRoutes from './routes/cryptoWalletRoutes';
import walletFundingRoutes from './routes/walletFundingRoutes';

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(','),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // HTTP request logging — pipe Morgan into Winston
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.http(msg.trim()) },
      skip: (_req, res) => process.env.NODE_ENV === 'production' && res.statusCode < 400,
    })
  );

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'CATALOG API' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/wishlist', wishlistRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/crypto-wallets', cryptoWalletRoutes);
  app.use('/api/wallet-funding', walletFundingRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
