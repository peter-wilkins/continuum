import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DevopsFeedbackResponseSchema } from '@continuum/shared';

const messageDir = await mkdtemp(join(tmpdir(), 'continuum-devops-feedback-'));
process.env.CONTINUUM_DEVOPS_MESSAGE_DIR = messageDir;

const { buildApp } = await import('./app.js');
const app = await buildApp();

try {
  const response = await app.inject({
    method: 'POST',
    url: '/api/devops-feedback',
    payload: {
      kind: 'small_fix',
      message: 'Smoke feedback from Continuum.',
      smallFix: true,
      context: {
        targetId: 'extended-thought',
        scopeId: 'scope:extended-thought',
        queryId: 'query:extended-thought',
        queryText: 'extended thought',
        lensOutputId: 'lens-output:smoke',
        path: '/public/extended-thought',
        gitHash: 'smoke',
        authStatus: 'logged_out',
        userAgent: 'smoke',
        viewport: {
          width: 390,
          height: 844,
        },
      },
    },
  });

  if (response.statusCode !== 202) {
    throw new Error(`Expected devops feedback 202, got ${response.statusCode}.`);
  }

  const parsed = DevopsFeedbackResponseSchema.parse(JSON.parse(response.body));
  const files = await readdir(messageDir);
  const jsonFiles = files.filter((file) => file.endsWith('.json'));
  const tempFiles = files.filter((file) => file.endsWith('.tmp'));

  if (jsonFiles.length !== 1) {
    throw new Error(`Expected one queued message, got ${jsonFiles.length}.`);
  }

  if (tempFiles.length !== 0) {
    throw new Error(`Expected no temporary message files, got ${tempFiles.length}.`);
  }

  const message = JSON.parse(await readFile(join(messageDir, jsonFiles[0]!), 'utf8')) as {
    id?: string;
    action?: string;
  };

  if (message.id !== parsed.messageId) {
    throw new Error('Queued feedback id did not match response id.');
  }

  if (message.action !== 'review_and_fix_if_small') {
    throw new Error(`Expected small-fix action, got ${String(message.action)}.`);
  }

  console.log(JSON.stringify({
    messageId: parsed.messageId,
    queuedAt: parsed.queuedAt,
    queuedFiles: jsonFiles.length,
  }, null, 2));
} finally {
  await app.close();
  await rm(messageDir, { recursive: true, force: true });
}
