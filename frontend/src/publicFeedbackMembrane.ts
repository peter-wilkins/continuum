import type {
  DevopsFeedbackKind,
  DevopsFeedbackRequest,
  DevopsFeedbackResponse,
  PublicContinuumResponse,
} from '@continuum/shared';

import type { PublicAuthState } from './usePublicLensPreference.js';

export type PublicFeedbackMembraneOutcome =
  | { status: 'empty' }
  | { status: 'missing_context' }
  | { status: 'sent'; messageId: string }
  | { status: 'error'; error: string };

export type PublicFeedbackMembraneEnvironment = {
  path: string;
  gitHash: string;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
};

export type PublicFeedbackMembraneDependencies = {
  submitFeedback: (feedback: DevopsFeedbackRequest) => Promise<DevopsFeedbackResponse>;
};

export async function submitPublicDevopsFeedback(input: {
  kind: DevopsFeedbackKind;
  message: string;
  smallFix: boolean;
  targetId: string;
  continuum: PublicContinuumResponse | null;
  activeLensOutputId: string | null;
  authState: PublicAuthState;
  environment: PublicFeedbackMembraneEnvironment;
  dependencies: PublicFeedbackMembraneDependencies;
}): Promise<PublicFeedbackMembraneOutcome> {
  const message = input.message.trim();
  if (!message) return { status: 'empty' };
  if (!input.continuum) return { status: 'missing_context' };

  try {
    const response = await input.dependencies.submitFeedback(
      buildPublicDevopsFeedbackRequest({
        kind: input.kind,
        message,
        smallFix: input.smallFix,
        targetId: input.targetId,
        continuum: input.continuum,
        activeLensOutputId: input.activeLensOutputId,
        authState: input.authState,
        environment: input.environment,
      }),
    );

    return { status: 'sent', messageId: response.messageId };
  } catch (err: unknown) {
    return {
      status: 'error',
      error: err instanceof Error ? err.message : 'Failed to send feedback',
    };
  }
}

export function buildPublicDevopsFeedbackRequest(input: {
  kind: DevopsFeedbackKind;
  message: string;
  smallFix: boolean;
  targetId: string;
  continuum: PublicContinuumResponse;
  activeLensOutputId: string | null;
  authState: PublicAuthState;
  environment: PublicFeedbackMembraneEnvironment;
}): DevopsFeedbackRequest {
  return {
    kind: input.smallFix ? 'small_fix' : input.kind,
    message: input.message,
    smallFix: input.smallFix,
    context: {
      targetId: input.targetId,
      scopeId: input.continuum.scope.id,
      queryId: input.continuum.query.id,
      queryText: input.continuum.query.text,
      lensOutputId: input.activeLensOutputId,
      path: input.environment.path,
      gitHash: input.environment.gitHash,
      authStatus: input.authState.status,
      userAgent: input.environment.userAgent,
      viewport: input.environment.viewport,
    },
  };
}
