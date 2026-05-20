import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { env } from './env.js';
import { registerEventRoutes } from './events.js';
import { registerTranscriptionRoutes } from './transcription.js';

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: env.FRONTEND_ORIGIN,
    credentials: true,
  });
  await app.register(multipart);

  app.get('/health', async () => ({ ok: true }));

  await registerEventRoutes(app);
  await registerTranscriptionRoutes(app);

  return app;
}
