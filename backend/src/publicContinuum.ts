import { randomUUID } from 'node:crypto';
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLensFeedbackSignal } from '@continuum/core';
import {
  PublicLensFeedbackRequestSchema,
  PublicLensFeedbackResponseSchema,
  PublicLensFeedbackSignalSchema,
  PublicLensFeedbackSummarySchema,
  type PublicLensFeedbackRequest,
  type PublicLensFeedbackSignal,
} from '@continuum/shared';
import type { FastifyInstance } from 'fastify';
import { requireAuth } from './auth.js';
import { createAdaPublicContinuum } from './publicAdaContinuum.js';

const feedbackLogPath = fileURLToPath(
  new URL('../../data/public-lens-feedback.jsonl', import.meta.url),
);

export async function registerPublicContinuumRoutes(app: FastifyInstance) {
  app.get('/api/public-continuum/ada-lovelace', async () => {
    return createAdaPublicContinuum();
  });

  app.get('/api/public-continuum/ada-lovelace/feedback-summary', async () => {
    const continuum = createAdaPublicContinuum();
    const feedback = await readFeedback();
    const counts = new Map(continuum.outputs.map((output) => [output.id, 0]));

    for (const signal of feedback) {
      if (!feedbackMatchesContinuum(signal, continuum)) continue;
      counts.set(signal.selectedLensOutputId, (counts.get(signal.selectedLensOutputId) ?? 0) + 1);
    }

    return PublicLensFeedbackSummarySchema.parse({
      total: [...counts.values()].reduce((total, count) => total + count, 0),
      byLensOutput: continuum.outputs.map((output) => ({
        lensOutputId: output.id,
        count: counts.get(output.id) ?? 0,
      })),
    });
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

    await appendFeedback(feedback);

    return reply.status(201).send(PublicLensFeedbackResponseSchema.parse({ feedback }));
  });
}

function feedbackMatchesContinuum(
  feedback: PublicLensFeedbackRequest,
  continuum: ReturnType<typeof createAdaPublicContinuum>,
): boolean {
  if (feedback.scopeId !== continuum.scope.id || feedback.queryId !== continuum.query.id) {
    return false;
  }

  const outputIds = continuum.outputs.map((output) => output.id);
  if (feedback.candidateLensOutputIds.length !== outputIds.length) {
    return false;
  }

  return (
    outputIds.every((outputId) => feedback.candidateLensOutputIds.includes(outputId)) &&
    outputIds.includes(feedback.selectedLensOutputId)
  );
}

async function appendFeedback(feedback: PublicLensFeedbackSignal): Promise<void> {
  await mkdir(dirname(feedbackLogPath), { recursive: true });
  await appendFile(feedbackLogPath, `${JSON.stringify(feedback)}\n`, 'utf8');
}

async function readFeedback(): Promise<PublicLensFeedbackSignal[]> {
  let contents: string;

  try {
    contents = await readFile(feedbackLogPath, 'utf8');
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
      return [];
    }

    throw err;
  }

  const feedback: PublicLensFeedbackSignal[] = [];

  for (const line of contents.split('\n')) {
    if (line.trim().length === 0) continue;

    try {
      const parsed = PublicLensFeedbackSignalSchema.safeParse(JSON.parse(line));
      if (parsed.success) feedback.push(parsed.data);
    } catch {
      continue;
    }
  }

  return feedback;
}
