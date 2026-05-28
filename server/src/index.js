import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { buildApp } from './app.js';

async function bootstrap() {
  await connectDB();
  const app = buildApp();
  app.listen(env.PORT, () => console.log(`🚀 Server on :${env.PORT}`));
}

bootstrap().catch((err) => {
  console.error('Boot failure', err);
  process.exit(1);
});
