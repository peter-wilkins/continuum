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

  if (continuum.synthesizedAnswer.status !== 'answered') {
    throw new Error(`Expected answered synthesized answer, got ${continuum.synthesizedAnswer.status}.`);
  }

  if (continuum.synthesizedAnswer.sourceSupport.length === 0) {
    throw new Error('Expected synthesized answer Source Support.');
  }

  if (continuum.linesOfInquiry.lines.length < 2) {
    throw new Error(`Expected multiple Lines of Inquiry, got ${continuum.linesOfInquiry.lines.length}.`);
  }

  const seedQuestionResponse = await app.inject({
    method: 'GET',
    url: '/api/public-continuum/extended-thought?question=When%20does%20a%20tool%20become%20part%20of%20thinking%3F',
  });

  if (seedQuestionResponse.statusCode !== 200) {
    throw new Error(`Expected seeded public Continuum 200, got ${seedQuestionResponse.statusCode}.`);
  }

  const seededContinuum = PublicContinuumResponseSchema.parse(JSON.parse(seedQuestionResponse.body));
  if (seededContinuum.query.text !== 'When does a tool become part of thinking?') {
    throw new Error(`Expected seeded query to be visible, got ${seededContinuum.query.text}.`);
  }

  const customQuestion = 'How can notebooks extend thinking?';
  const customQuestionResponse = await app.inject({
    method: 'GET',
    url: `/api/public-continuum/extended-thought?question=${encodeURIComponent(customQuestion)}`,
  });

  if (customQuestionResponse.statusCode !== 200) {
    throw new Error(`Expected custom public Continuum 200, got ${customQuestionResponse.statusCode}.`);
  }

  const customQuestionContinuum = PublicContinuumResponseSchema.parse(
    JSON.parse(customQuestionResponse.body),
  );
  if (customQuestionContinuum.query.text !== customQuestion) {
    throw new Error(`Expected custom query to be visible, got ${customQuestionContinuum.query.text}.`);
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
    synthesizedAnswerStatus: continuum.synthesizedAnswer.status,
    lineOfInquiryCount: continuum.linesOfInquiry.lines.length,
    feedbackTotal: summary.total,
  }, null, 2));
} finally {
  await app.close();
}
