import { randomUUID } from 'node:crypto';
import { createLensFeedbackSignal } from '@continuum/core';
import {
  PublicConciergeLatestRunQuerySchema,
  PublicConciergeRunRequestSchema,
  PublicLensFeedbackRequestSchema,
  PublicLensFeedbackResponseSchema,
  WorkflowManagerPhoneJourneyStateResponseSchema,
  type PublicLensFeedbackSignal,
} from '@continuum/shared';
import type { FastifyInstance } from 'fastify';
import { requireAuth } from './auth.js';
import {
  appendPublicLensFeedback,
  feedbackMatchesContinuum,
  summarizePublicLensFeedback,
} from './publicLensFeedbackLog.js';
import {
  getPublicConciergeRuns,
  publicConciergeLatestRunResponse,
  publicConciergeRunResponse,
} from './publicConciergeRuns.js';
import { getPublicContinuumTarget, type PublicContinuumTarget } from './publicContinuumTargets.js';
import {
  WorkflowManagerBridgeError,
  fetchWorkflowManagerBridgeState,
  postWorkflowManagerBridgeMessage,
} from './workflowManagerBridge.js';

export async function registerPublicContinuumRoutes(app: FastifyInstance) {
  app.get('/api/public-continuum/:targetId', async (request, reply) => {
    const target = getTargetFromParams(request.params);
    if (!target) {
      return reply.status(404).send({ error: 'Unknown public Continuum target' });
    }

    return target.createContinuum(getTargetOptions(request.query));
  });

  app.get('/api/public-continuum/:targetId/feedback-summary', async (request, reply) => {
    const target = getTargetFromParams(request.params);
    if (!target) {
      return reply.status(404).send({ error: 'Unknown public Continuum target' });
    }

    const continuum = target.createContinuum();
    return summarizePublicLensFeedback(continuum);
  });

  app.post('/api/public-continuum/:targetId/concierge-runs', async (request, reply) => {
    const target = getTargetFromParams(request.params);
    if (!target) {
      await reply.status(404).send({ error: 'Unknown public Continuum target' });
      return;
    }

    const parsed = PublicConciergeRunRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      await reply.status(400).send({ error: 'Invalid Concierge run payload' });
      return;
    }

    const run = getPublicConciergeRuns().createRun({
      targetId: target.id,
      request: parsed.data,
    });

    await reply.status(201).send(publicConciergeRunResponse(run));
  });

  app.post('/api/public-continuum/:targetId/chairman-bridge/messages', async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;

    const target = getTargetFromParams(request.params);
    if (!target) {
      await reply.status(404).send({ error: 'Unknown public Continuum target' });
      return;
    }

    const parsed = PublicConciergeRunRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      await reply.status(400).send({ error: 'Invalid Chairman Bridge payload' });
      return;
    }

    const state = await postWorkflowManagerBridgeMessage({
      accessToken: accessTokenFromRequest(request),
      request: parsed.data,
    }).catch(async (error: unknown) => {
      if (error instanceof WorkflowManagerBridgeError) {
        await reply.status(error.statusCode).send({ error: error.message });
        return null;
      }
      throw error;
    });
    if (!state) return;

    await reply.status(202).send(WorkflowManagerPhoneJourneyStateResponseSchema.parse({ state }));
  });

  app.get('/api/public-continuum/:targetId/chairman-bridge/state', async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;

    const target = getTargetFromParams(request.params);
    if (!target) {
      await reply.status(404).send({ error: 'Unknown public Continuum target' });
      return;
    }

    const state = await fetchWorkflowManagerBridgeState({
      accessToken: accessTokenFromRequest(request),
    }).catch(async (error: unknown) => {
      if (error instanceof WorkflowManagerBridgeError) {
        await reply.status(error.statusCode).send({ error: error.message });
        return null;
      }
      throw error;
    });
    if (!state) return;

    await reply.send(WorkflowManagerPhoneJourneyStateResponseSchema.parse({ state }));
  });

  app.get('/api/public-continuum/:targetId/concierge-runs/latest', async (request, reply) => {
    const target = getTargetFromParams(request.params);
    if (!target) {
      await reply.status(404).send({ error: 'Unknown public Continuum target' });
      return;
    }

    const parsed = PublicConciergeLatestRunQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      await reply.status(400).send({ error: 'Invalid Concierge latest query' });
      return;
    }

    const run = getPublicConciergeRuns().getLatestRun({
      targetId: target.id,
      clientInstanceId: parsed.data.clientInstanceId,
      queryId: parsed.data.queryId,
      lineId: parsed.data.lineId,
    });

    await reply.send(publicConciergeLatestRunResponse(run));
  });

  app.get('/api/public-continuum/:targetId/concierge-runs/:runId', async (request, reply) => {
    const target = getTargetFromParams(request.params);
    if (!target) {
      await reply.status(404).send({ error: 'Unknown public Continuum target' });
      return;
    }

    const { runId } = request.params as { runId: unknown };
    if (typeof runId !== 'string') {
      await reply.status(400).send({ error: 'Invalid Concierge run id' });
      return;
    }

    const run = getPublicConciergeRuns().getRun(runId);
    if (!run || run.targetId !== target.id) {
      await reply.status(404).send({ error: 'Unknown Concierge run' });
      return;
    }

    await reply.send(publicConciergeRunResponse(run));
  });

  app.post('/api/public-continuum/:targetId/feedback', async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;

    const target = getTargetFromParams(request.params);
    if (!target) {
      await reply.status(404).send({ error: 'Unknown public Continuum target' });
      return;
    }

    const parsed = PublicLensFeedbackRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      await reply.status(400).send({ error: 'Invalid feedback payload' });
      return;
    }

    const continuum = target.createContinuum();
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

function getTargetFromParams(params: unknown): PublicContinuumTarget | null {
  const { targetId } = params as { targetId: unknown };
  if (typeof targetId !== 'string') return null;
  return getPublicContinuumTarget(targetId);
}

function getTargetOptions(query: unknown) {
  const { question } = query as { question?: unknown };
  return typeof question === 'string' ? { question } : undefined;
}

function accessTokenFromRequest(request: { headers: { authorization?: string | undefined } }) {
  const header = request.headers.authorization;
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
}
