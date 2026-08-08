import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: `Not found - ${req.originalUrl}` });
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} → ${statusCode}`, {
      message: err.message,
      stack: err.stack,
    });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} → ${statusCode}: ${err.message}`);
  }

  res.status(statusCode).json({
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};
