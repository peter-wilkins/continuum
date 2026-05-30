import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PublicConciergeRun, PublicContinuumResponse } from '@continuum/shared';

import {
  buildPublicChairmanRequest,
  submitPublicChairmanResponse,
} from './publicChairmanJourney.js';

describe('Public Chairman Journey', () => {
  it('builds a source-backed Chairman request from the active line', () => {
    const continuum = publicContinuumFixture();
    const request = buildPublicChairmanRequest({
      continuum,
      line: continuum.linesOfInquiry.lines[0]!,
      publicClientInstanceId: 'client:1',
      userResponse: 'A notebook lets me compare thoughts.',
      inputMode: 'text',
    });

    assert.deepEqual(request, {
      clientInstanceId: 'client:1',
      scopeId: 'scope:extended-thought',
      queryId: 'query:extended-thought',
      queryText: 'How do tools extend thought?',
      lineId: 'line:1',
      lineQuestion: 'When does a tool become part of thinking?',
      userResponse: 'A notebook lets me compare thoughts.',
      inputMode: 'text',
    });
  });

  it('uses the local Concierge for logged-in replies so stale Bridge output cannot become agreement text', async () => {
    const continuum = publicContinuumFixture();
    const localRun = conciergeRunFixture(continuum);

    const outcome = await submitPublicChairmanResponse({
      targetId: 'extended-thought',
      publicClientInstanceId: 'client:1',
      auth: { status: 'logged_in' },
      continuum,
      line: continuum.linesOfInquiry.lines[0]!,
      userResponse: '  send this to the chairman  ',
      inputMode: 'speech',
      dependencies: {
        submitConciergeRun: async (_targetId, request) => {
          assert.equal(request.userResponse, 'send this to the chairman');
          assert.equal(request.inputMode, 'speech');
          return { run: localRun };
        },
      },
    });

    assert.equal(outcome.status, 'local_answered');
    if (outcome.status === 'local_answered') {
      assert.equal(outcome.run.id, localRun.id);
    }
  });

  it('does not submit empty or missing-line replies', async () => {
    const continuum = publicContinuumFixture();
    let calls = 0;
    const dependencies = {
      submitConciergeRun: async () => {
        calls += 1;
        return { run: conciergeRunFixture(continuum) };
      },
    };

    const empty = await submitPublicChairmanResponse({
      targetId: 'extended-thought',
      publicClientInstanceId: 'client:1',
      auth: { status: 'logged_out' },
      continuum,
      line: continuum.linesOfInquiry.lines[0]!,
      userResponse: '   ',
      inputMode: 'text',
      dependencies,
    });
    const missing = await submitPublicChairmanResponse({
      targetId: 'extended-thought',
      publicClientInstanceId: 'client:1',
      auth: { status: 'logged_out' },
      continuum: null,
      line: null,
      userResponse: 'I have an answer.',
      inputMode: 'text',
      dependencies,
    });

    assert.equal(empty.status, 'empty');
    assert.equal(missing.status, 'missing_line');
    assert.equal(calls, 0);
  });
});

function conciergeRunFixture(continuum: PublicContinuumResponse): PublicConciergeRun {
  return {
    id: 'run:1',
    targetId: 'extended-thought',
    clientInstanceId: 'client:1',
    scopeId: continuum.scope.id,
    queryId: continuum.query.id,
    queryText: continuum.query.text,
    lineId: continuum.linesOfInquiry.lines[0]!.id,
    lineQuestion: continuum.linesOfInquiry.lines[0]!.question,
    userResponse: 'Local reply',
    inputMode: 'text',
    status: 'answered',
    chairmanReply: 'Local chairman',
    nextLineQuestion: 'What next?',
    progress: 0.4,
    progressLabel: 'Local active',
    createdAt: '2026-05-30T15:00:00.000Z',
    updatedAt: '2026-05-30T15:00:00.000Z',
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
