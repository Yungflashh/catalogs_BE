import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { connectDB } from './config/db';
import logger from './utils/logger';

const app = createApp();
const PORT = Number(process.env.PORT) || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`CATALOG API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
};

start().catch((err) => {
  logger.error('Failed to start server', { error: (err as Error).message });
  process.exit(1);
});
