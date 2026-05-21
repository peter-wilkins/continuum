import {
  createImportedEntryFromCanonicalEvent,
  debugRankingProfiles,
  retrieveContinuationCandidates,
  type CanonicalEvent,
} from '@continuum/core';

const canonicalEvent: CanonicalEvent = {
  id: 'continuum-smoke-event-001',
  source: {
    platform: 'markdown',
    key: 'continuum-smoke:boiler-quote:001',
    fingerprint: 'continuum-smoke-fingerprint-001',
    externalConversationId: 'continuum-smoke-conversation',
    externalMessageId: 'continuum-smoke-message-001',
    artifactId: null,
    externalParentId: null,
    canonicalParentEventId: null,
  },
  provenance: {
    sourceFamily: 'continuum-smoke',
    sourceName: 'Continuum core smoke test',
    upstreamSources: ['continuum/backend/src/coreSmoke.ts'],
    derivedFrom: [],
    retrievedAt: '2026-05-21T12:00:00.000Z',
    license: null,
  },
  time: {
    createdAt: '2026-05-21T12:00:00.000Z',
    createdAtConfidence: 'exact',
  },
  actor: {
    role: 'user',
  },
  participants: [
    {
      role: 'author',
      name: 'Peter',
      address: 'peter@example.local',
    },
  ],
  content: {
    kind: 'text',
    subject: 'Boiler quote',
    text: 'Resume the boiler quote thread. Customer is waiting for revised pricing and supplier confidence is low.',
  },
};

const entry = createImportedEntryFromCanonicalEvent(canonicalEvent);
const candidates = retrieveContinuationCandidates({
  resumeRequest: {
    text: 'Resume boiler quote',
    requestedAt: '2026-05-21T12:05:00.000Z',
  },
  entries: [entry],
  rankingProfile: debugRankingProfiles.balanced,
});

if (candidates.length < 1) {
  throw new Error('Expected at least one Continuum Core continuation candidate');
}

const topCandidate = candidates[0];
if (!topCandidate) {
  throw new Error('Continuum Core returned an empty candidate list after length check');
}

console.log(JSON.stringify({
  importedEntryId: entry.id,
  candidateCount: candidates.length,
  topCandidate: {
    id: topCandidate.id,
    title: topCandidate.title,
    confidence: topCandidate.confidence,
    supportingEntryIds: topCandidate.supportingEntryIds,
  },
}, null, 2));
