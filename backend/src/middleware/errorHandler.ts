import express from 'express';
import { ApiError } from '../utils/ApiError';

export const errorHandler = (
  err: Error | ApiError,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction
): void => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err.message || 'Error interno del servidor';

  console.error(`[ERROR ${statusCode}]:`, message);
  res.status(statusCode).json({
    ok: false,
    error: message,
  });
};
