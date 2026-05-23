import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { WorkflowManagerPhoneJourneyStateSchema } from '@continuum/shared';

process.env.SUPABASE_URL ||= 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'service-role';
process.env.OPENAI_API_KEY ||= 'openai-key';
process.env.WORKFLOW_MANAGER_BRIDGE_TIMEOUT_MS ||= '1000';

let receivedAuthorization = '';
let receivedMessageBody = '';
let receivedRouteTarget = '';

const server = createServer(async (request, response) => {
  if (request.method === 'POST' && request.url === '/v1/messages') {
    receivedAuthorization = String(request.headers.authorization ?? '');
    const payload = JSON.parse(await readRequestBody(request)) as {
      body?: unknown;
      target?: unknown;
    };
    receivedMessageBody = String(payload.body ?? '');
    receivedRouteTarget = String(payload.target ?? '');
    sendJson(response, bridgeState({
      latestBody: 'Received. Waiting for Chairman.',
      pendingBody: receivedMessageBody,
      progressLabel: 'Waiting for Chairman',
    }));
    return;
  }

  if (request.method === 'GET' && request.url === '/v1/journey-state') {
    sendJson(response, bridgeState({
      latestBody: 'Bridge replied.',
      pendingBody: '',
      progressLabel: 'Bridge replied',
    }));
    return;
  }

  sendJson(response, { error: 'not found' }, 404);
});

await new Promise<void>((resolve) => {
  server.listen(0, '127.0.0.1', resolve);
});

try {
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Expected fake Bridge TCP address.');
  }

  process.env.WORKFLOW_MANAGER_BRIDGE_URL = `http://127.0.0.1:${address.port}`;
  const {
    fetchWorkflowManagerBridgeState,
    postWorkflowManagerBridgeMessage,
  } = await import('./workflowManagerBridge.js');

  const postedState = await postWorkflowManagerBridgeMessage({
    accessToken: 'smoke-token',
    request: {
      clientInstanceId: 'public-client:smoke',
      scopeId: 'scope:extended-thought',
      queryId: 'query:smoke',
      queryText: 'How can tools extend thought?',
      lineId: 'line:smoke',
      lineQuestion: 'What should the user inspect next?',
      userResponse: 'Show me the smallest useful next step.',
      inputMode: 'text',
    },
  });

  if (receivedAuthorization !== 'Bearer smoke-token') {
    throw new Error('Expected Bridge client to forward bearer token.');
  }
  if (!receivedMessageBody.includes('What should the user inspect next?')) {
    throw new Error('Expected Bridge message body to include Chairman Line context.');
  }
  if (receivedRouteTarget !== 'workflow-manager') {
    throw new Error('Expected Bridge client to send route target.');
  }
  if (postedState.latestBody !== 'Received. Waiting for Chairman.') {
    throw new Error(`Expected waiting projection, got ${postedState.latestBody}`);
  }
  if (!(postedState.pendingBody ?? '').includes('Show me the smallest useful next step.')) {
    throw new Error('Expected waiting projection to include pending user reply.');
  }

  const fetchedState = await fetchWorkflowManagerBridgeState({ accessToken: 'smoke-token' });
  if (fetchedState.progressLabel !== 'Bridge replied') {
    throw new Error(`Expected fetched state from fake Bridge, got ${fetchedState.progressLabel}`);
  }

  console.log(JSON.stringify({
    posted: postedState.progressLabel,
    fetched: fetchedState.progressLabel,
    bodyIncludesLineContext: receivedMessageBody.includes('What should the user inspect next?'),
    routeTarget: receivedRouteTarget,
  }, null, 2));
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function bridgeState(input: {
  latestBody: string;
  pendingBody: string;
  progressLabel: string;
}) {
  return WorkflowManagerPhoneJourneyStateSchema.parse({
    schemaVersion: 'workflow-manager.phone-journey-state.v1',
    generatedAt: '2026-05-24T00:00:00Z',
    currentJourneyId: 'phone-conversation-loop',
    currentJourneyTitle: 'Phone Conversation Loop',
    status: 'active',
    progress: 0.82,
    progressLabel: input.progressLabel,
    latestOutboxEventId: '',
    latestBody: input.latestBody,
    suggestedNextStep: '',
    pendingBody: input.pendingBody,
    pendingEventId: input.pendingBody ? 'pending-smoke' : '',
    recentEvents: [],
  });
}

function readRequestBody(request: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk: string) => {
      body += chunk;
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function sendJson(response: ServerResponse, payload: unknown, statusCode = 200) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  response.end(body);
}
