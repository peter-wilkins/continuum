import { randomUUID } from 'node:crypto';
import {
  WorkflowManagerPhoneJourneyStateSchema,
  type PublicConciergeRunRequest,
  type WorkflowManagerPhoneJourneyState,
} from '@continuum/shared';
import { env } from './env.js';

type BridgeCallInput = {
  accessToken: string;
};

type BridgeMessageInput = BridgeCallInput & {
  request: PublicConciergeRunRequest;
};

export class WorkflowManagerBridgeError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 502) {
    super(message);
    this.name = 'WorkflowManagerBridgeError';
    this.statusCode = statusCode;
  }
}

export async function postWorkflowManagerBridgeMessage(
  input: BridgeMessageInput,
): Promise<WorkflowManagerPhoneJourneyState> {
  const response = await callBridge({
    accessToken: input.accessToken,
    method: 'POST',
    path: '/v1/messages',
    body: {
      body: bridgeMessageBody(input.request),
      clientMessageId: `continuum-${randomUUID()}`,
      createdAt: new Date().toISOString(),
      deviceId: input.request.clientInstanceId,
      eventType: 'user_message',
      inputMode: 'text',
      intent: 'message',
      journeyId: 'phone-conversation-loop',
      membrane: 'personal',
      target: 'workflow-manager',
    },
  });

  return WorkflowManagerPhoneJourneyStateSchema.parse(response);
}

export async function fetchWorkflowManagerBridgeState(
  input: BridgeCallInput,
): Promise<WorkflowManagerPhoneJourneyState> {
  const response = await callBridge({
    accessToken: input.accessToken,
    method: 'GET',
    path: '/v1/journey-state',
  });

  return WorkflowManagerPhoneJourneyStateSchema.parse(response);
}

function bridgeMessageBody(request: PublicConciergeRunRequest) {
  return [
    'Continuum Chairman message',
    `Scope: ${request.scopeId}`,
    `Query: ${request.queryText}`,
    `Line: ${request.lineQuestion}`,
    `User reply: ${request.userResponse}`,
    `Input mode: ${request.inputMode}`,
  ].join('\n');
}

async function callBridge(input: {
  accessToken: string;
  method: 'GET' | 'POST';
  path: string;
  body?: unknown;
}) {
  const baseUrl = env.WORKFLOW_MANAGER_BRIDGE_URL.replace(/\/+$/, '');
  const requestInit: RequestInit = {
    method: input.method,
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      ...(input.body ? { 'Content-Type': 'application/json' } : {}),
    },
    signal: AbortSignal.timeout(env.WORKFLOW_MANAGER_BRIDGE_TIMEOUT_MS),
  };

  if (input.body) {
    requestInit.body = JSON.stringify(input.body);
  }

  const response = await fetch(`${baseUrl}${input.path}`, requestInit).catch((error: unknown) => {
    throw new WorkflowManagerBridgeError(
      error instanceof Error ? error.message : 'Workflow Manager Bridge did not respond',
    );
  });

  const payload = await response.json().catch(() => {
    throw new WorkflowManagerBridgeError('Workflow Manager Bridge returned invalid JSON');
  });

  if (!response.ok) {
    const errorMessage =
      payload && typeof payload === 'object' && 'error' in payload
        ? String(payload.error)
        : 'Workflow Manager Bridge request failed';
    throw new WorkflowManagerBridgeError(errorMessage, response.status);
  }

  return payload;
}
