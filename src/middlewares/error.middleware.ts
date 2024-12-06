// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { APIError } from '@errors/index';

export const errorHandler = (
  err: Error | APIError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof APIError ? err.statusCode : 500;
  const message = err.message || 'Something went wrong';

  console.error(`[ERROR] ${statusCode} - ${message} - ${req.originalUrl}`);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
