import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  applyLearningAnswer,
  deriveLearningJourneyView,
  initialLearningJourneyState,
} from './learningJourney.js';

describe('Learning Journey', () => {
  it('advances one step when the answer is clear enough to continue', () => {
    const next = applyLearningAnswer(
      initialLearningJourneyState,
      'A notebook lets the thought stay visible while I work on it.',
    );

    assert.equal(next.move, 'advance');
    assert.equal(next.step, 3);
    assert.equal(next.branches, 0);
  });

  it('asks for clarification when the answer sounds uncertain', () => {
    const next = applyLearningAnswer(
      initialLearningJourneyState,
      "I don't know, is it like remembering?",
    );

    assert.equal(next.move, 'clarify');
    assert.equal(next.step, 2);
    assert.equal(next.branches, 0);
  });

  it('parks a side path when the answer introduces another direction', () => {
    const next = applyLearningAnswer(
      initialLearningJourneyState,
      'It helps me think, but what about talking to another person?',
    );

    assert.equal(next.move, 'branch');
    assert.equal(next.step, 2);
    assert.equal(next.branches, 1);
  });

  it('does not advance beyond the end of the current journey', () => {
    const next = applyLearningAnswer(
      { ...initialLearningJourneyState, step: 5 },
      'The tool changes what I can compare next.',
    );

    assert.equal(next.move, 'advance');
    assert.equal(next.step, 5);
  });

  it('derives the visible question, clue, label, and progress from journey state', () => {
    const view = deriveLearningJourneyView(
      { move: 'branch', step: 2, branches: 1 },
      {
        firstEvidenceTitle: 'External marks hold thoughts in place',
        fallbackAnswer: 'The sources point to tools for thought.',
      },
    );

    assert.equal(view.question, 'Which side path should we hold without losing the main one?');
    assert.equal(view.clue, 'The answer introduced another direction, so the journey parks it as a branch.');
    assert.equal(view.label, 'Branch held (1)');
    assert.equal(view.progressLabel, '2 / 5');
  });
});
