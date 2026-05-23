import {
  PublicContinuumResponseSchema,
  PublicLensFeedbackSummarySchema,
} from '@continuum/shared';
import { buildApp } from './app.js';

const app = await buildApp();

try {
  const continuumResponse = await app.inject({
    method: 'GET',
    url: '/api/public-continuum/extended-thought',
  });

  if (continuumResponse.statusCode !== 200) {
    throw new Error(`Expected public Continuum 200, got ${continuumResponse.statusCode}.`);
  }

  const continuum = PublicContinuumResponseSchema.parse(JSON.parse(continuumResponse.body));
  if (continuum.events.length < 6) {
    throw new Error(`Expected at least 6 public events, got ${continuum.events.length}.`);
  }

  if (continuum.outputs.length !== 3) {
    throw new Error(`Expected 3 Lens outputs, got ${continuum.outputs.length}.`);
  }

  if (continuum.thoughtCards.length < 100) {
    throw new Error(`Expected public Thought Cards, got ${continuum.thoughtCards.length}.`);
  }

  const summaryResponse = await app.inject({
    method: 'GET',
    url: '/api/public-continuum/extended-thought/feedback-summary',
  });

  if (summaryResponse.statusCode !== 200) {
    throw new Error(`Expected feedback summary 200, got ${summaryResponse.statusCode}.`);
  }

  const summary = PublicLensFeedbackSummarySchema.parse(JSON.parse(summaryResponse.body));

  console.log(JSON.stringify({
    title: continuum.scope.title,
    eventCount: continuum.events.length,
    thoughtCardCount: continuum.thoughtCards.length,
    lensOutputCount: continuum.outputs.length,
    feedbackTotal: summary.total,
  }, null, 2));
} finally {
  await app.close();
}
