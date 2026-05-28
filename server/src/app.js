import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';

export function buildApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: false }));
  app.use(express.json({ limit: '1mb' }));
  app.use(mongoSanitize());

  app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'taskflow-api' }));

  // ROUTES_MOUNT — added in subsequent tasks

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
