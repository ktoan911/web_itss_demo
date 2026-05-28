import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import apiRoutes from './routes/index.js';

export function buildApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: false }));
  app.use(express.json({ limit: '1mb' }));
  app.use((req, _res, next) => {
    if (req.body) mongoSanitize.sanitize(req.body);
    next();
  });

  app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'Task88-api' }));

  app.use('/api', apiRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
