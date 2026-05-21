import {
  createAmbiguousResumeSurface,
  createImportedEntryFromCanonicalEvent,
  debugRankingProfiles,
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
const surface = createAmbiguousResumeSurface({
  resumeRequest: {
    text: 'Resume boiler quote',
    requestedAt: '2026-05-21T12:05:00.000Z',
  },
  entries: [entry],
  rankingProfile: debugRankingProfiles.balanced,
  narrowSpreadThreshold: 0.1,
});

if (surface.topCandidate === null) {
  throw new Error('Expected at least one Continuum Core continuation candidate');
}

console.log(JSON.stringify({
  importedEntryId: entry.id,
  candidateCount: surface.candidates.length,
  candidateSpread: surface.candidateSpread,
  isAmbiguous: surface.isAmbiguous,
  topCandidate: {
    id: surface.topCandidate.id,
    title: surface.topCandidate.title,
    confidence: surface.topCandidate.confidence,
    supportingEntryIds: surface.topCandidate.supportingEntryIds,
  },
}, null, 2));
