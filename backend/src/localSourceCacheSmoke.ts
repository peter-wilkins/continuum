import Database from 'better-sqlite3';
import { existsSync } from 'node:fs';
import type { CanonicalEvent } from '@continuum/core';
import { LocalSourceCache } from './localSourceCache.js';

const cache = new LocalSourceCache();
const unique = Date.now().toString(36);

const firstEvent = canonicalEvent({
  id: `local-cache-smoke:${unique}:001`,
  platform: 'chatgpt',
  createdAt: '2026-05-21T10:00:00.000Z',
  text: 'Need to quote Bob for the boiler.',
});
const secondEvent = canonicalEvent({
  id: `local-cache-smoke:${unique}:002`,
  platform: 'email',
  createdAt: '2026-05-21T11:00:00.000Z',
  text: 'Supplier came back with revised pricing.',
});

const batch = cache.importCanonicalEventJsonl({
  batchName: 'local-source-cache-smoke',
  jsonl: [
    JSON.stringify(firstEvent),
    'not json',
    JSON.stringify(secondEvent),
  ].join('\n'),
});

if (!existsSync(cache.databasePath)) {
  throw new Error(`Expected SQLite database at ${cache.databasePath}`);
}

if (batch.importedRows !== 2 || batch.quarantinedRows !== 1 || batch.totalRows !== 3) {
  throw new Error(`Unexpected import result: ${JSON.stringify(batch)}`);
}

const timeline = cache.listEvents({ limit: 10 });
const importedIds = new Set(timeline.map((event) => event.id));
if (!importedIds.has(firstEvent.id) || !importedIds.has(secondEvent.id)) {
  throw new Error('Timeline did not include imported events');
}

const emailEvents = cache.listEvents({ sourcePlatform: 'email', limit: 10 });
if (!emailEvents.some((event) => event.id === secondEvent.id)) {
  throw new Error('Source filter did not include the email event');
}
if (emailEvents.some((event) => event.id === firstEvent.id)) {
  throw new Error('Source filter included a non-email event');
}

const detail = cache.getEvent(firstEvent.id);
if (!detail || JSON.parse(detail.eventJson).id !== firstEvent.id) {
  throw new Error('Detail lookup did not return the imported Canonical Event JSON');
}
if (detail.filterDecision.action !== 'needs_review' || detail.memoryActive) {
  throw new Error(`Unexpected local source cache curation: ${JSON.stringify(detail.filterDecision)}`);
}

const summary = cache.getSummary();
if (summary.totalEvents < 2 || summary.filterSummary.needsReview < 2) {
  throw new Error(`Unexpected local source cache summary: ${JSON.stringify(summary)}`);
}

const schema = new Database(cache.databasePath, { readonly: true });
const tables = new Set(
  schema
    .prepare("select name from sqlite_master where type = 'table'")
    .all()
    .map((row) => (row as { name: string }).name),
);
const indexes = new Set(
  schema
    .prepare("select name from sqlite_master where type = 'index'")
    .all()
    .map((row) => (row as { name: string }).name),
);
schema.close();
cache.close();

for (const table of [
  'local_source_events',
  'local_import_batches',
  'local_import_batch_events',
  'local_import_quarantine',
]) {
  if (!tables.has(table)) {
    throw new Error(`Missing table ${table}`);
  }
}

for (const index of [
  'local_source_events_created_at_idx',
  'local_source_events_source_platform_idx',
  'local_source_events_filter_action_idx',
  'local_import_batch_events_event_id_idx',
]) {
  if (!indexes.has(index)) {
    throw new Error(`Missing index ${index}`);
  }
}

console.log(JSON.stringify({
  databasePath: cache.databasePath,
  batch,
  filterSummary: summary.filterSummary,
  timelineTopId: timeline[0]?.id ?? null,
  filteredEmailIds: emailEvents.map((event) => event.id),
}, null, 2));

function canonicalEvent(input: {
  id: string;
  platform: CanonicalEvent['source']['platform'];
  createdAt: string;
  text: string;
}): CanonicalEvent {
  return {
    id: input.id,
    source: {
      platform: input.platform,
      key: input.id,
      fingerprint: `${input.id}:fingerprint`,
      externalConversationId: `${input.id}:conversation`,
      externalMessageId: `${input.id}:message`,
      artifactId: null,
      externalParentId: null,
      canonicalParentEventId: null,
    },
    provenance: {
      sourceFamily: 'continuum-smoke',
      sourceName: input.platform,
      upstreamSources: ['backend/src/localSourceCacheSmoke.ts'],
      derivedFrom: [],
      retrievedAt: '2026-05-21T12:00:00.000Z',
      license: null,
    },
    time: {
      createdAt: input.createdAt,
      createdAtConfidence: 'exact',
    },
    actor: {
      role: 'user',
    },
    participants: [],
    content: {
      kind: 'text',
      subject: null,
      text: input.text,
    },
  };
}
