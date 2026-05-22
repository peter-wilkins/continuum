import { randomUUID } from 'node:crypto';
import { createLensFeedbackSignal } from '@continuum/core';
import {
  PublicLensFeedbackRequestSchema,
  PublicLensFeedbackResponseSchema,
  type PublicLensFeedbackSignal,
} from '@continuum/shared';
import type { FastifyInstance } from 'fastify';
import { requireAuth } from './auth.js';
import { createAdaPublicContinuum } from './publicAdaContinuum.js';
import {
  appendPublicLensFeedback,
  feedbackMatchesContinuum,
  summarizePublicLensFeedback,
} from './publicLensFeedbackLog.js';

export async function registerPublicContinuumRoutes(app: FastifyInstance) {
  app.get('/api/public-continuum/ada-lovelace', async () => {
    return createAdaPublicContinuum();
  });

  app.get('/api/public-continuum/ada-lovelace/feedback-summary', async () => {
    const continuum = createAdaPublicContinuum();
    return summarizePublicLensFeedback(continuum);
  });

  app.post('/api/public-continuum/ada-lovelace/feedback', async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;

    const parsed = PublicLensFeedbackRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      await reply.status(400).send({ error: 'Invalid feedback payload' });
      return;
    }

    const continuum = createAdaPublicContinuum();
    if (!feedbackMatchesContinuum(parsed.data, continuum)) {
      await reply.status(400).send({ error: 'Feedback does not match the active Continuum' });
      return;
    }

    const feedback = createLensFeedbackSignal({
      id: `lens-feedback:${randomUUID()}`,
      userId: user.id,
      scopeId: parsed.data.scopeId,
      queryId: parsed.data.queryId,
      selectedLensOutputId: parsed.data.selectedLensOutputId,
      candidateLensOutputIds: parsed.data.candidateLensOutputIds,
      signal: 'preferred',
      createdAt: new Date().toISOString(),
    }) satisfies PublicLensFeedbackSignal;

    await appendPublicLensFeedback(feedback);

    return reply.status(201).send(PublicLensFeedbackResponseSchema.parse({ feedback }));
  });
}
