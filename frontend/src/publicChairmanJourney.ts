import type {
  PublicConciergeRun,
  PublicConciergeRunRequest,
  PublicContinuumResponse,
  WorkflowManagerPhoneJourneyState,
} from '@continuum/shared';
import type { Session } from '@supabase/supabase-js';

import { normalizeSpokenText } from './browserSpeech.js';

export type ChairmanInputMode = 'speech' | 'text';

export type PublicChairmanLine = PublicContinuumResponse['linesOfInquiry']['lines'][number];

export type PublicChairmanSubmitOutcome =
  | { status: 'empty' }
  | { status: 'missing_line'; message: string }
  | { status: 'bridge_answered'; state: WorkflowManagerPhoneJourneyState }
  | { status: 'local_answered'; run: PublicConciergeRun }
  | { status: 'error'; message: string };

export type PublicChairmanSubmitDependencies = {
  submitBridgeMessage: (
    targetId: string,
    session: Session,
    run: PublicConciergeRunRequest,
  ) => Promise<{ state: WorkflowManagerPhoneJourneyState }>;
  submitConciergeRun: (
    targetId: string,
    run: PublicConciergeRunRequest,
  ) => Promise<{ run: PublicConciergeRun }>;
};

export async function submitPublicChairmanResponse(input: {
  targetId: string;
  publicClientInstanceId: string;
  auth:
    | { status: 'logged_in'; session: Session }
    | { status: 'logged_out' }
    | { status: 'loading' };
  continuum: PublicContinuumResponse | null;
  line: PublicChairmanLine | null;
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
    publicClientInstanceId: input.publicClientInstanceId,
    userResponse: normalizedResponse,
    inputMode: input.inputMode,
  });

  if (input.auth.status === 'logged_in') {
    try {
      const bridgeResponse = await input.dependencies.submitBridgeMessage(
        input.targetId,
        input.auth.session,
        request,
      );

      return {
        status: 'bridge_answered',
        state: bridgeResponse.state,
      };
    } catch {
      // Logged-in bridge is preferred, but local Concierge keeps the journey moving.
    }
  }

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
    lineQuestion: input.line.question,
    userResponse: input.userResponse,
    inputMode: input.inputMode,
  };
}
