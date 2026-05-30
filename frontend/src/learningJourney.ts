export type LearningMove = 'waiting' | 'advance' | 'clarify' | 'branch';

export type LearningJourneyState = {
  move: LearningMove;
  step: number;
  branches: number;
};

export type LearningJourneyView = {
  question: string;
  clue: string;
  label: string;
  progressLabel: string;
};

export type LearningJourneyContext = {
  firstEvidenceTitle: string;
  fallbackAnswer: string;
};

export const learningJourneyStepCount = 5;

export const initialLearningJourneyState: LearningJourneyState = {
  move: 'waiting',
  step: 2,
  branches: 0,
};

export function applyLearningAnswer(
  state: LearningJourneyState,
  answer: string,
): LearningJourneyState {
  const move = classifyLearningAnswer(answer);

  if (move === 'advance') {
    return {
      ...state,
      move,
      step: Math.min(state.step + 1, learningJourneyStepCount),
    };
  }

  if (move === 'branch') {
    return {
      ...state,
      move,
      branches: state.branches + 1,
    };
  }

  return {
    ...state,
    move,
  };
}

export function deriveLearningJourneyView(
  state: LearningJourneyState,
  context: LearningJourneyContext,
): LearningJourneyView {
  return {
    question: learningQuestionForMove(state.move),
    clue: learningClueForMove(state.move, context),
    label: learningMoveLabel(state.move, state.branches),
    progressLabel: `${state.step} / ${learningJourneyStepCount}`,
  };
}

export function classifyLearningAnswer(answer: string): LearningMove {
  const normalized = answer.trim().toLocaleLowerCase();
  if (normalized.length === 0) return 'waiting';

  if (
    normalized.includes('but') ||
    normalized.includes('although') ||
    normalized.includes('what about') ||
    normalized.includes('also')
  ) {
    return 'branch';
  }

  if (
    normalized.includes('?') ||
    normalized.includes('not sure') ||
    normalized.includes("don't know") ||
    normalized.includes('confused')
  ) {
    return 'clarify';
  }

  return 'advance';
}

function learningQuestionForMove(move: LearningMove): string {
  if (move === 'clarify') {
    return 'What is the smallest example you can picture?';
  }

  if (move === 'branch') {
    return 'Which side path should we hold without losing the main one?';
  }

  if (move === 'advance') {
    return 'How does that change what a person can think next?';
  }

  return 'What changes when thinking moves outside your head?';
}

function learningMoveLabel(move: LearningMove, branches: number): string {
  if (move === 'advance') return 'Advanced';
  if (move === 'clarify') return 'Clarifying';
  if (move === 'branch') return `Branch held (${branches})`;

  return 'Current clue';
}

function learningClueForMove(
  move: LearningMove,
  context: LearningJourneyContext,
): string {
  if (move === 'advance') {
    return 'Your answer was treated as enough to move the path forward.';
  }

  if (move === 'clarify') {
    return 'The answer sounded uncertain, so the journey asks for a smaller concrete example.';
  }

  if (move === 'branch') {
    return 'The answer introduced another direction, so the journey parks it as a branch.';
  }

  return context.firstEvidenceTitle || context.fallbackAnswer;
}
