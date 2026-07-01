import { type ErrorRequestHandler } from 'express';
import { logger } from '../logs/logger.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode ?? err.status ?? 500;

  logger.error({
    message: err.message,
    stack: err.stack,
    path: _req.originalUrl,
    method: _req.method,
    statusCode
  });

  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
};
