import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

export function notFound(_req, res) {
  res.status(404).json({ error: { message: 'Route not found' } });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { message: err.message, code: err.code, fields: err.fields },
    });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: { message: 'Invalid id' } });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: { message: 'Duplicate key', fields: err.keyValue } });
  }
  if (env.NODE_ENV !== 'test') console.error('UNHANDLED', err);
  res.status(500).json({ error: { message: 'Internal server error' } });
}
