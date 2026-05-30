import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PublicContinuumResponse } from '@continuum/shared';

import {
  buildPublicDevopsFeedbackRequest,
  submitPublicDevopsFeedback,
} from './publicFeedbackMembrane.js';

describe('Public feedback membrane', () => {
  it('builds feedback context from the active public Continuum view', () => {
    const continuum = publicContinuumFixture();
    const request = buildPublicDevopsFeedbackRequest({
      kind: 'bug',
      message: 'The progress label is confusing.',
      smallFix: false,
      targetId: 'extended-thought',
      continuum,
      activeLensOutputId: 'lens-output:1',
      authState: { status: 'logged_out' },
      environment: feedbackEnvironmentFixture(),
    });

    assert.deepEqual(request, {
      kind: 'bug',
      message: 'The progress label is confusing.',
      smallFix: false,
      context: {
        targetId: 'extended-thought',
        scopeId: 'scope:extended-thought',
        queryId: 'query:extended-thought',
        queryText: 'How do tools extend thought?',
        lensOutputId: 'lens-output:1',
        path: '/public/extended-thought',
        gitHash: 'abc1234',
        authStatus: 'logged_out',
        userAgent: 'node-test',
        viewport: {
          width: 390,
          height: 844,
        },
      },
    });
  });

  it('routes small fixes as small_fix while preserving the original switch state', () => {
    const request = buildPublicDevopsFeedbackRequest({
      kind: 'bug',
      message: 'Tiny copy fix.',
      smallFix: true,
      targetId: 'extended-thought',
      continuum: publicContinuumFixture(),
      activeLensOutputId: null,
      authState: { status: 'logged_in', session: {} as never },
      environment: feedbackEnvironmentFixture(),
    });

    assert.equal(request.kind, 'small_fix');
    assert.equal(request.smallFix, true);
    assert.equal(request.context.authStatus, 'logged_in');
    assert.equal(request.context.lensOutputId, null);
  });

  it('submits feedback through the membrane and returns a sent outcome', async () => {
    const outcome = await submitPublicDevopsFeedback({
      kind: 'improvement',
      message: '  Make this less documenty.  ',
      smallFix: false,
      targetId: 'extended-thought',
      continuum: publicContinuumFixture(),
      activeLensOutputId: 'lens-output:1',
      authState: { status: 'logged_out' },
      environment: feedbackEnvironmentFixture(),
      dependencies: {
        submitFeedback: async (request) => {
          assert.equal(request.message, 'Make this less documenty.');
          return {
            messageId: 'feedback:1',
            queuedAt: '2026-05-30T15:30:00.000Z',
          };
        },
      },
    });

    assert.deepEqual(outcome, { status: 'sent', messageId: 'feedback:1' });
  });

  it('does not submit empty feedback or feedback without active context', async () => {
    let calls = 0;
    const dependencies = {
      submitFeedback: async () => {
        calls += 1;
        return {
          messageId: 'feedback:1',
          queuedAt: '2026-05-30T15:30:00.000Z',
        };
      },
    };

    const empty = await submitPublicDevopsFeedback({
      kind: 'bug',
      message: '   ',
      smallFix: false,
      targetId: 'extended-thought',
      continuum: publicContinuumFixture(),
      activeLensOutputId: null,
      authState: { status: 'logged_out' },
      environment: feedbackEnvironmentFixture(),
      dependencies,
    });
    const missingContext = await submitPublicDevopsFeedback({
      kind: 'bug',
      message: 'Something happened.',
      smallFix: false,
      targetId: 'extended-thought',
      continuum: null,
      activeLensOutputId: null,
      authState: { status: 'logged_out' },
      environment: feedbackEnvironmentFixture(),
      dependencies,
    });

    assert.equal(empty.status, 'empty');
    assert.equal(missingContext.status, 'missing_context');
    assert.equal(calls, 0);
  });
});

function feedbackEnvironmentFixture() {
  return {
    path: '/public/extended-thought',
    gitHash: 'abc1234',
    userAgent: 'node-test',
    viewport: {
      width: 390,
      height: 844,
    },
  };
}

function publicContinuumFixture(): PublicContinuumResponse {
  return {
    scope: {
      id: 'scope:extended-thought',
      title: 'Extended Thought',
      primaryLabel: 'extended thought',
      focusLabel: null,
    },
    query: {
      id: 'query:extended-thought',
      text: 'How do tools extend thought?',
    },
    lenses: [],
    outputs: [],
    thoughtCards: [
      {
        id: 'card:1',
        lensOutputId: 'lens-output:1',
        title: 'Tools hold thought',
        body: 'Tools hold thought outside the head.',
        sourceParagraphIds: ['paragraph:1'],
      },
    ],
    sourceParagraphs: [
      {
        id: 'paragraph:1',
        canonicalEventId: 'event:1',
        paragraphIndex: 0,
        title: 'Extended mind',
        sourceName: 'Wikipedia',
        sourceUrl: 'https://example.test/wiki',
        license: 'fixture',
      },
    ],
    synthesizedAnswer: {
      id: 'answer:1',
      queryId: 'query:extended-thought',
      status: 'answered',
      answer: 'Tools can extend thought.',
      sourceSupport: [
        {
          thoughtCardId: 'card:1',
          sourceParagraphIds: ['paragraph:1'],
        },
      ],
      lensOutputIdsForCompare: ['lens-output:1'],
      generatedAt: '2026-05-30T15:00:00.000Z',
      generation: {
        strategy: 'fixture',
        model: null,
        parameters: [],
      },
    },
    linesOfInquiry: {
      queryId: 'query:extended-thought',
      recommendedLineId: 'line:1',
      lines: [
        {
          id: 'line:1',
          queryId: 'query:extended-thought',
          synthesisMove: 'next_question',
          status: 'candidate',
          recommended: true,
          title: 'Tool boundary',
          question: 'When does a tool become part of thinking?',
          desiredOutcome: 'Fixture outcome',
          whyThis: {
            synthesisMove: 'next_question',
            explanation: 'Fixture why',
          },
          confidence: 1,
          sourceSupport: [
            {
              thoughtCardId: 'card:1',
              sourceParagraphIds: ['paragraph:1'],
            },
          ],
          generatedAt: '2026-05-30T15:00:00.000Z',
          generation: {
            strategy: 'fixture',
            model: null,
            parameters: [],
          },
        },
      ],
      generatedAt: '2026-05-30T15:00:00.000Z',
      generation: {
        strategy: 'fixture',
        model: null,
        parameters: [],
      },
    },
    events: [
      {
        id: 'event:1',
        subject: 'Extended thought',
        sourceFamily: 'wikimedia',
        sourceName: 'Wikipedia',
        sourceUrl: 'https://example.test/wiki',
        license: 'fixture',
        text: 'Tools hold thought outside the head.',
      },
    ],
  };
}
