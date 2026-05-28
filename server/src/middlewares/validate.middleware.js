import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

// validate({ body?, query?, params? }) → middleware
export const validate = (schemas) => (req, _res, next) => {
  try {
    if (schemas.body)   req.body   = schemas.body.parse(req.body);
    if (schemas.query) {
      const parsed = schemas.query.parse(req.query);
      Object.defineProperty(req, 'query', { value: parsed, writable: true, configurable: true });
    }
    if (schemas.params) {
      const parsed = schemas.params.parse(req.params);
      Object.defineProperty(req, 'params', { value: parsed, writable: true, configurable: true });
    }
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const fields = {};
      for (const issue of err.issues) fields[issue.path.join('.')] = issue.message;
      return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', fields));
    }
    next(err);
  }
};
