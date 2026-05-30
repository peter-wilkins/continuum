import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PublicContinuumResponse } from '@continuum/shared';

import { derivePublicContinuumView } from './publicContinuumView.js';

describe('Public Continuum view', () => {
  it('links synthesized answer support to Thought Cards and source paragraphs', () => {
    const continuum = publicContinuumFixture();
    const view = derivePublicContinuumView({
      continuum,
      activeRecommendedLine: continuum.linesOfInquiry.lines[0]!,
      chairmanBridgeState: null,
      chairmanRun: null,
    });

    assert.equal(view.answerSupport.length, 1);
    assert.equal(view.answerSupport[0]!.card.title, 'Tools hold thought');
    assert.equal(view.answerSupport[0]!.sourceParagraphs[0]!.title, 'Extended mind');
    assert.equal(view.eventsById.get('event:1')!.subject, 'Extended thought');
  });

  it('uses Bridge progress before local Concierge progress', () => {
    const continuum = publicContinuumFixture();
    const view = derivePublicContinuumView({
      continuum,
      activeRecommendedLine: continuum.linesOfInquiry.lines[0]!,
      chairmanBridgeState: {
        schemaVersion: 'workflow-manager.phone-journey-state.v1',
        generatedAt: '2026-05-30T15:00:00.000Z',
        currentJourneyId: 'continuum-public-chairman-loop',
        currentJourneyTitle: 'Chairman',
        status: 'active',
        latestBody: 'Bridge reply',
        pendingBody: 'User reply',
        progress: 0.7,
        progressLabel: 'Bridge active',
        suggestedNextStep: 'Continue',
      },
      chairmanRun: {
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
      },
    });

    assert.equal(view.chairmanProgress, 0.7);
    assert.equal(view.chairmanProgressPercent, '70%');
    assert.equal(view.chairmanProgressLabel, 'Bridge active');
  });

  it('falls back to an opened line when no Chairman run exists yet', () => {
    const continuum = publicContinuumFixture();
    const view = derivePublicContinuumView({
      continuum,
      activeRecommendedLine: continuum.linesOfInquiry.lines[0]!,
      chairmanBridgeState: null,
      chairmanRun: null,
    });

    assert.equal(view.chairmanProgress, 0.25);
    assert.equal(view.chairmanProgressPercent, '25%');
    assert.equal(view.chairmanProgressLabel, 'Line opened');
  });
});

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
