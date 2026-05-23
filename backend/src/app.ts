import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { env } from './env.js';
import { registerDevopsFeedbackRoutes } from './devopsFeedback.js';
import { registerEventRoutes } from './events.js';
import { registerLocalSourceCacheRoutes } from './localSourceCache.js';
import { registerPublicContinuumRoutes } from './publicContinuum.js';
import { registerTranscriptionRoutes } from './transcription.js';

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: env.FRONTEND_ORIGIN,
    credentials: true,
  });
  await app.register(multipart);

  app.get('/health', async () => ({ ok: true }));

  await registerDevopsFeedbackRoutes(app);
  await registerPublicContinuumRoutes(app);
  await registerEventRoutes(app);
  await registerLocalSourceCacheRoutes(app);
  await registerTranscriptionRoutes(app);

  return app;
}
