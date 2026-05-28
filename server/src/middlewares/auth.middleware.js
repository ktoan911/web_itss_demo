import { verifyToken } from '../services/jwt.service.js';
import { AppError } from '../utils/AppError.js';

export function authRequired(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next(new AppError('Unauthorized', 401));
  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
}
