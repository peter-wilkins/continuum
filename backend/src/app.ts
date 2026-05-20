import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './env.js';
import { registerEventRoutes } from './events.js';

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: env.FRONTEND_ORIGIN,
    credentials: true,
  });

  app.get('/health', async () => ({ ok: true }));

  await registerEventRoutes(app);

  return app;
}
