import type {
  PublicConciergeRun,
  PublicConciergeRunRequest,
  PublicContinuumResponse,
} from '@continuum/shared';

import { normalizeSpokenText } from './browserSpeech.js';

export type ChairmanInputMode = 'speech' | 'text';

export type PublicChairmanLine = PublicContinuumResponse['linesOfInquiry']['lines'][number];

export type PublicChairmanSubmitOutcome =
  | { status: 'empty' }
  | { status: 'missing_line'; message: string }
  | { status: 'local_answered'; run: PublicConciergeRun }
  | { status: 'error'; message: string };

export type PublicChairmanSubmitDependencies = {
  submitConciergeRun: (
    targetId: string,
    run: PublicConciergeRunRequest,
  ) => Promise<{ run: PublicConciergeRun }>;
};

export async function submitPublicChairmanResponse(input: {
  targetId: string;
  publicClientInstanceId: string;
  auth:
    | { status: 'logged_in' }
    | { status: 'logged_out' }
    | { status: 'loading' };
  continuum: PublicContinuumResponse | null;
  line: PublicChairmanLine | null;
  currentQuestion: string | null;
  userResponse: string;
  inputMode: ChairmanInputMode;
  dependencies: PublicChairmanSubmitDependencies;
}): Promise<PublicChairmanSubmitOutcome> {
  const normalizedResponse = normalizeSpokenText(input.userResponse);
  if (!normalizedResponse) return { status: 'empty' };

  if (!input.continuum || !input.line) {
    return {
      status: 'missing_line',
      message: 'No Chairman Line is available here yet.',
    };
  }

  const request = buildPublicChairmanRequest({
    continuum: input.continuum,
    line: input.line,
    currentQuestion: input.currentQuestion,
    publicClientInstanceId: input.publicClientInstanceId,
    userResponse: normalizedResponse,
    inputMode: input.inputMode,
  });

  try {
    const response = await input.dependencies.submitConciergeRun(input.targetId, request);

    return {
      status: 'local_answered',
      run: response.run,
    };
  } catch (err: unknown) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Chairman reply failed',
    };
  }
}

export function buildPublicChairmanRequest(input: {
  continuum: PublicContinuumResponse;
  line: PublicChairmanLine;
  currentQuestion: string | null;
  publicClientInstanceId: string;
  userResponse: string;
  inputMode: ChairmanInputMode;
}): PublicConciergeRunRequest {
  return {
    clientInstanceId: input.publicClientInstanceId,
    scopeId: input.continuum.scope.id,
    queryId: input.continuum.query.id,
    queryText: input.continuum.query.text,
    lineId: input.line.id,
    lineQuestion: input.currentQuestion ?? input.line.question,
    userResponse: input.userResponse,
    inputMode: input.inputMode,
  };
}
