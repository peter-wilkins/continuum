import { randomUUID } from 'node:crypto';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DevopsFeedbackRequestSchema,
  DevopsFeedbackResponseSchema,
  type DevopsFeedbackRequest,
} from '@continuum/shared';
import type { FastifyInstance } from 'fastify';

const defaultMessageDir = fileURLToPath(
  new URL('../../../continuum-core/data/landing-queue/devops-messages/messages/', import.meta.url),
);

type DevopsFeedbackAction = 'review_and_fix_if_small' | 'review_and_triage';

type DevopsFeedbackMessage = {
  schema: 'continuum.devops-feedback.v1';
  id: string;
  createdAt: string;
  source: 'continuum-public-app';
  action: DevopsFeedbackAction;
  feedback: DevopsFeedbackRequest;
  serverContext: {
    method: string;
    route: string;
    userAgent: string | null;
    referer: string | null;
  };
};

export async function registerDevopsFeedbackRoutes(app: FastifyInstance) {
  app.post('/api/devops-feedback', async (request, reply) => {
    const parsed = DevopsFeedbackRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      await reply.status(400).send({ error: 'Invalid feedback payload' });
      return;
    }

    const queuedAt = new Date().toISOString();
    const messageId = `devops-feedback:${randomUUID()}`;
    const action: DevopsFeedbackAction = parsed.data.smallFix
      ? 'review_and_fix_if_small'
      : 'review_and_triage';

    await writeDevopsFeedbackMessage({
      schema: 'continuum.devops-feedback.v1',
      id: messageId,
      createdAt: queuedAt,
      source: 'continuum-public-app',
      action,
      feedback: parsed.data,
      serverContext: {
        method: request.method,
        route: request.url,
        userAgent: headerToString(request.headers['user-agent']),
        referer: headerToString(request.headers.referer),
      },
    });

    return reply.status(202).send(DevopsFeedbackResponseSchema.parse({ messageId, queuedAt }));
  });
}

async function writeDevopsFeedbackMessage(message: DevopsFeedbackMessage) {
  const messageDir = process.env.CONTINUUM_DEVOPS_MESSAGE_DIR || defaultMessageDir;
  await mkdir(messageDir, { recursive: true });

  const uuid = message.id.slice('devops-feedback:'.length);
  const basename = `${safeTimestamp(message.createdAt)}-${uuid}.json`;
  const finalPath = join(messageDir, basename);
  const tempPath = `${finalPath}.tmp`;

  await writeFile(tempPath, `${JSON.stringify(message, null, 2)}\n`, 'utf8');
  await rename(tempPath, finalPath);
}

function safeTimestamp(isoTimestamp: string) {
  return isoTimestamp.replaceAll('-', '').replaceAll(':', '').replaceAll('.', '');
}

function headerToString(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value.join(', ');
  return value ?? null;
}
