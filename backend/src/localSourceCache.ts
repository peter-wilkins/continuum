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
} from '@continuum/core';
import { requireAuth } from './auth.js';

const moduleDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(moduleDir, '../..');
const defaultDatabasePath = resolve(repoRoot, 'data/local-source-cache.sqlite');

type SqliteEventRow = {
  id: string;
  sourcePlatform: string;
  sourceName: string;
  sourceKey: string;
  externalConversationId: string;
  externalMessageId: string;
  createdAt: string;
  createdAtConfidence: string;
  ingestedAt: string;
  actorRole: string;
  subject: string | null;
  text: string;
  eventJson: string;
};

type ImportBatchRow = {
  id: string;
  sourceName: string | null;
  importStartedAt: string;
  importFinishedAt: string;
  totalRows: number;
  importedRows: number;
  quarantinedRows: number;
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
        sourceName,
        importStartedAt,
        importFinishedAt,
        totalRows,
        importedRows,
        quarantinedRows
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
      set importFinishedAt = @importFinishedAt,
          importedRows = @importedRows,
          quarantinedRows = @quarantinedRows
      where id = @id
    `);
    const insertEvent = this.db.prepare(`
      insert into local_source_events (
        id,
        sourcePlatform,
        sourceName,
        sourceKey,
        externalConversationId,
        externalMessageId,
        createdAt,
        createdAtConfidence,
        ingestedAt,
        actorRole,
        subject,
        text,
        eventJson
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
        sourcePlatform = excluded.sourcePlatform,
        sourceName = excluded.sourceName,
        sourceKey = excluded.sourceKey,
        externalConversationId = excluded.externalConversationId,
        externalMessageId = excluded.externalMessageId,
        createdAt = excluded.createdAt,
        createdAtConfidence = excluded.createdAtConfidence,
        ingestedAt = excluded.ingestedAt,
        actorRole = excluded.actorRole,
        subject = excluded.subject,
        text = excluded.text,
        eventJson = excluded.eventJson
    `);
    const linkBatchEvent = this.db.prepare(`
      insert or ignore into local_import_batch_events (batchId, eventId)
      values (@batchId, @eventId)
    `);
    const quarantine = this.db.prepare(`
      insert into local_import_quarantine (
        batchId,
        rowNumber,
        rawLine,
        error,
        quarantinedAt
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
          insertEvent.run(row);
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
            where sourcePlatform = ?
            order by createdAt desc, id desc
            limit ?
          `)
          .all(input.sourcePlatform, limit)
      : this.db
          .prepare(`
            select *
            from local_source_events
            order by createdAt desc, id desc
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
    this.dropDisposableSnakeCaseSchema();
    this.db.exec(`
      create table if not exists local_source_events (
        id text primary key,
        sourcePlatform text not null,
        sourceName text not null,
        sourceKey text not null,
        externalConversationId text not null,
        externalMessageId text not null,
        createdAt text not null,
        createdAtConfidence text not null,
        ingestedAt text not null,
        actorRole text not null,
        subject text,
        text text not null,
        eventJson text not null
      );

      create table if not exists local_import_batches (
        id text primary key,
        sourceName text,
        importStartedAt text not null,
        importFinishedAt text not null,
        totalRows integer not null,
        importedRows integer not null,
        quarantinedRows integer not null
      );

      create table if not exists local_import_batch_events (
        batchId text not null references local_import_batches(id) on delete cascade,
        eventId text not null references local_source_events(id) on delete cascade,
        primary key (batchId, eventId)
      );

      create table if not exists local_import_quarantine (
        id integer primary key autoincrement,
        batchId text not null references local_import_batches(id) on delete cascade,
        rowNumber integer not null,
        rawLine text not null,
        error text not null,
        quarantinedAt text not null
      );

      create index if not exists local_source_events_created_at_idx
        on local_source_events(createdAt desc);

      create index if not exists local_source_events_source_platform_idx
        on local_source_events(sourcePlatform);

      create index if not exists local_import_batch_events_event_id_idx
        on local_import_batch_events(eventId);
    `);
  }

  private dropDisposableSnakeCaseSchema() {
    const oldColumn = this.db
      .prepare("select name from pragma_table_info('local_source_events') where name = 'source_platform'")
      .get();
    if (!oldColumn) {
      return;
    }

    this.db.exec(`
      drop table if exists local_import_quarantine;
      drop table if exists local_import_batch_events;
      drop table if exists local_import_batches;
      drop table if exists local_source_events;
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

function mapEventRow(row: SqliteEventRow): LocalSourceCacheEvent {
  return LocalSourceCacheEventSchema.parse({
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
  });
}

function mapBatchRow(row: ImportBatchRow): ImportResult {
  return {
    id: row.id,
    sourceName: row.sourceName,
    importStartedAt: row.importStartedAt,
    importFinishedAt: row.importFinishedAt,
    totalRows: row.totalRows,
    importedRows: row.importedRows,
    quarantinedRows: row.quarantinedRows,
  };
}
