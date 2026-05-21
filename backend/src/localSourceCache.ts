import Database from 'better-sqlite3';
import type { Database as DatabaseConnection } from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FastifyInstance } from 'fastify';
import {
  LocalSourceCacheImportRequestSchema,
  LocalSourceCacheEventSchema,
  type LocalSourceCacheEvent,
  type LocalSourceCacheImportResponse,
} from '@continuum/shared';
import {
  canonicalEventToLocalSourceCacheEventRow,
  type CanonicalEvent,
  type LocalSourceCacheEventRow,
} from '@continuum/core';
import { requireAuth } from './auth.js';

const moduleDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(moduleDir, '../..');
const defaultDatabasePath = resolve(repoRoot, 'data/local-source-cache.sqlite');

type SqliteEventRow = {
  id: string;
  source_platform: string;
  source_name: string;
  source_key: string;
  external_conversation_id: string;
  external_message_id: string;
  created_at: string;
  created_at_confidence: string;
  ingested_at: string;
  actor_role: string;
  subject: string | null;
  text: string;
  event_json: string;
};

type ImportBatchRow = {
  id: string;
  source_name: string | null;
  import_started_at: string;
  import_finished_at: string;
  total_rows: number;
  imported_rows: number;
  quarantined_rows: number;
};

type ImportResult = LocalSourceCacheImportResponse['batch'];

export class LocalSourceCache {
  readonly databasePath: string;

  private readonly db: DatabaseConnection;

  constructor(databasePath = defaultDatabasePath) {
    this.databasePath = databasePath;
    mkdirSync(dirname(databasePath), { recursive: true });
    this.db = new Database(databasePath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.migrate();
  }

  close() {
    this.db.close();
  }

  importCanonicalEventJsonl(input: { jsonl: string; batchName?: string }): ImportResult {
    const batchId = `local-import:${randomUUID()}`;
    const importStartedAt = new Date().toISOString();
    const ingestedAt = importStartedAt;
    const lines = input.jsonl
      .split(/\r?\n/u)
      .map((line, index) => ({ raw: line, rowNumber: index + 1 }))
      .filter((line) => line.raw.trim().length > 0);

    let importedRows = 0;
    let quarantinedRows = 0;

    const insertBatch = this.db.prepare(`
      insert into local_import_batches (
        id,
        source_name,
        import_started_at,
        import_finished_at,
        total_rows,
        imported_rows,
        quarantined_rows
      ) values (
        @id,
        @sourceName,
        @importStartedAt,
        @importFinishedAt,
        @totalRows,
        @importedRows,
        @quarantinedRows
      )
    `);
    const updateBatch = this.db.prepare(`
      update local_import_batches
      set import_finished_at = @importFinishedAt,
          imported_rows = @importedRows,
          quarantined_rows = @quarantinedRows
      where id = @id
    `);
    const insertEvent = this.db.prepare(`
      insert into local_source_events (
        id,
        source_platform,
        source_name,
        source_key,
        external_conversation_id,
        external_message_id,
        created_at,
        created_at_confidence,
        ingested_at,
        actor_role,
        subject,
        text,
        event_json
      ) values (
        @id,
        @sourcePlatform,
        @sourceName,
        @sourceKey,
        @externalConversationId,
        @externalMessageId,
        @createdAt,
        @createdAtConfidence,
        @ingestedAt,
        @actorRole,
        @subject,
        @text,
        @eventJson
      )
      on conflict(id) do update set
        source_platform = excluded.source_platform,
        source_name = excluded.source_name,
        source_key = excluded.source_key,
        external_conversation_id = excluded.external_conversation_id,
        external_message_id = excluded.external_message_id,
        created_at = excluded.created_at,
        created_at_confidence = excluded.created_at_confidence,
        ingested_at = excluded.ingested_at,
        actor_role = excluded.actor_role,
        subject = excluded.subject,
        text = excluded.text,
        event_json = excluded.event_json
    `);
    const linkBatchEvent = this.db.prepare(`
      insert or ignore into local_import_batch_events (batch_id, event_id)
      values (@batchId, @eventId)
    `);
    const quarantine = this.db.prepare(`
      insert into local_import_quarantine (
        batch_id,
        row_number,
        raw_line,
        error,
        quarantined_at
      ) values (
        @batchId,
        @rowNumber,
        @rawLine,
        @error,
        @quarantinedAt
      )
    `);

    const runImport = this.db.transaction(() => {
      insertBatch.run({
        id: batchId,
        sourceName: input.batchName ?? null,
        importStartedAt,
        importFinishedAt: importStartedAt,
        totalRows: lines.length,
        importedRows: 0,
        quarantinedRows: 0,
      });

      for (const line of lines) {
        try {
          const event = JSON.parse(line.raw) as CanonicalEvent;
          const row = canonicalEventToLocalSourceCacheEventRow(event, ingestedAt);
          insertEvent.run(toSqliteEventRow(row));
          linkBatchEvent.run({ batchId, eventId: row.id });
          importedRows += 1;
        } catch (error) {
          quarantinedRows += 1;
          quarantine.run({
            batchId,
            rowNumber: line.rowNumber,
            rawLine: line.raw,
            error: error instanceof Error ? error.message : String(error),
            quarantinedAt: new Date().toISOString(),
          });
        }
      }

      updateBatch.run({
        id: batchId,
        importFinishedAt: new Date().toISOString(),
        importedRows,
        quarantinedRows,
      });
    });

    runImport();

    const batch = this.db
      .prepare('select * from local_import_batches where id = ?')
      .get(batchId) as ImportBatchRow | undefined;
    if (!batch) {
      throw new Error(`Import batch ${batchId} was not stored`);
    }

    return mapBatchRow(batch);
  }

  listEvents(input: { sourcePlatform?: string; limit?: number } = {}): LocalSourceCacheEvent[] {
    const limit = Math.max(1, Math.min(input.limit ?? 100, 500));
    const rows = input.sourcePlatform
      ? this.db
          .prepare(`
            select *
            from local_source_events
            where source_platform = ?
            order by created_at desc, id desc
            limit ?
          `)
          .all(input.sourcePlatform, limit)
      : this.db
          .prepare(`
            select *
            from local_source_events
            order by created_at desc, id desc
            limit ?
          `)
          .all(limit);

    return rows.map((row) => mapEventRow(row as SqliteEventRow));
  }

  getEvent(id: string): LocalSourceCacheEvent | null {
    const row = this.db
      .prepare('select * from local_source_events where id = ?')
      .get(id) as SqliteEventRow | undefined;
    return row ? mapEventRow(row) : null;
  }

  private migrate() {
    this.db.exec(`
      create table if not exists local_source_events (
        id text primary key,
        source_platform text not null,
        source_name text not null,
        source_key text not null,
        external_conversation_id text not null,
        external_message_id text not null,
        created_at text not null,
        created_at_confidence text not null,
        ingested_at text not null,
        actor_role text not null,
        subject text,
        text text not null,
        event_json text not null
      );

      create table if not exists local_import_batches (
        id text primary key,
        source_name text,
        import_started_at text not null,
        import_finished_at text not null,
        total_rows integer not null,
        imported_rows integer not null,
        quarantined_rows integer not null
      );

      create table if not exists local_import_batch_events (
        batch_id text not null references local_import_batches(id) on delete cascade,
        event_id text not null references local_source_events(id) on delete cascade,
        primary key (batch_id, event_id)
      );

      create table if not exists local_import_quarantine (
        id integer primary key autoincrement,
        batch_id text not null references local_import_batches(id) on delete cascade,
        row_number integer not null,
        raw_line text not null,
        error text not null,
        quarantined_at text not null
      );

      create index if not exists idx_local_source_events_created_at
        on local_source_events(created_at desc);

      create index if not exists idx_local_source_events_source_platform
        on local_source_events(source_platform);

      create index if not exists idx_local_import_batch_events_event_id
        on local_import_batch_events(event_id);
    `);
  }
}

let sharedCache: LocalSourceCache | null = null;

export function getLocalSourceCache() {
  sharedCache ??= new LocalSourceCache();
  return sharedCache;
}

export async function registerLocalSourceCacheRoutes(app: FastifyInstance) {
  const cache = getLocalSourceCache();

  app.post('/api/local-source-cache/import-jsonl', async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;

    const parsed = LocalSourceCacheImportRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      await reply.status(400).send({ error: 'Invalid local source cache import payload' });
      return;
    }

    const importInput: { jsonl: string; batchName?: string } = {
      jsonl: parsed.data.jsonl,
    };
    if (parsed.data.batchName !== undefined) {
      importInput.batchName = parsed.data.batchName;
    }

    const batch = cache.importCanonicalEventJsonl(importInput);
    return reply.status(201).send({ batch });
  });

  app.get('/api/local-source-cache/events', async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;

    const query = request.query as { sourcePlatform?: string; limit?: string };
    const limit = query.limit ? Number.parseInt(query.limit, 10) : undefined;
    const listInput: { sourcePlatform?: string; limit?: number } = {};
    if (query.sourcePlatform !== undefined) {
      listInput.sourcePlatform = query.sourcePlatform;
    }
    if (limit !== undefined && Number.isFinite(limit)) {
      listInput.limit = limit;
    }

    return { events: cache.listEvents(listInput) };
  });

  app.get('/api/local-source-cache/events/:id', async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };
    const event = cache.getEvent(id);
    if (!event) {
      await reply.status(404).send({ error: 'Local source cache event not found' });
      return;
    }

    return { event };
  });
}

function toSqliteEventRow(row: LocalSourceCacheEventRow) {
  return {
    id: row.id,
    sourcePlatform: row.sourcePlatform,
    sourceName: row.sourceName,
    sourceKey: row.sourceKey,
    externalConversationId: row.externalConversationId,
    externalMessageId: row.externalMessageId,
    createdAt: row.createdAt,
    createdAtConfidence: row.createdAtConfidence,
    ingestedAt: row.ingestedAt,
    actorRole: row.actorRole,
    subject: row.subject,
    text: row.text,
    eventJson: row.eventJson,
  };
}

function mapEventRow(row: SqliteEventRow): LocalSourceCacheEvent {
  return LocalSourceCacheEventSchema.parse({
    id: row.id,
    sourcePlatform: row.source_platform,
    sourceName: row.source_name,
    sourceKey: row.source_key,
    externalConversationId: row.external_conversation_id,
    externalMessageId: row.external_message_id,
    createdAt: row.created_at,
    createdAtConfidence: row.created_at_confidence,
    ingestedAt: row.ingested_at,
    actorRole: row.actor_role,
    subject: row.subject,
    text: row.text,
    eventJson: row.event_json,
  });
}

function mapBatchRow(row: ImportBatchRow): ImportResult {
  return {
    id: row.id,
    sourceName: row.source_name,
    importStartedAt: row.import_started_at,
    importFinishedAt: row.import_finished_at,
    totalRows: row.total_rows,
    importedRows: row.imported_rows,
    quarantinedRows: row.quarantined_rows,
  };
}
