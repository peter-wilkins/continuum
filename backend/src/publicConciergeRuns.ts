import Database from 'better-sqlite3';
import type { Database as DatabaseConnection } from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PublicConciergeRunResponseSchema,
  PublicConciergeRunSchema,
  type PublicConciergeRun,
  type PublicConciergeRunRequest,
} from '@continuum/shared';

const moduleDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(moduleDir, '../..');
const defaultDatabasePath = resolve(repoRoot, 'data/public-concierge-runs.sqlite');

type PublicConciergeRunRow = {
  id: string;
  targetId: string;
  scopeId: string;
  queryId: string;
  queryText: string;
  lineId: string;
  lineQuestion: string;
  userResponse: string;
  inputMode: string;
  status: string;
  progress: number;
  progressLabel: string;
  chairmanReply: string;
  nextLineQuestion: string;
  createdAt: string;
  updatedAt: string;
};

export class PublicConciergeRuns {
  readonly databasePath: string;

  private readonly db: DatabaseConnection;

  constructor(databasePath = defaultDatabasePath) {
    this.databasePath = databasePath;
    mkdirSync(dirname(databasePath), { recursive: true });
    this.db = new Database(databasePath);
    this.db.pragma('journal_mode = WAL');
    this.migrate();
  }

  close() {
    this.db.close();
  }

  createRun(input: {
    targetId: string;
    request: PublicConciergeRunRequest;
  }): PublicConciergeRun {
    const now = new Date().toISOString();
    const row: PublicConciergeRunRow = {
      id: `public-concierge-run:${randomUUID()}`,
      targetId: input.targetId,
      scopeId: input.request.scopeId,
      queryId: input.request.queryId,
      queryText: input.request.queryText,
      lineId: input.request.lineId,
      lineQuestion: input.request.lineQuestion,
      userResponse: input.request.userResponse,
      inputMode: input.request.inputMode,
      status: 'answered',
      progress: 0.55,
      progressLabel: 'Chairman heard your reply',
      chairmanReply: chairmanReplyFor(input.request),
      nextLineQuestion: input.request.lineQuestion,
      createdAt: now,
      updatedAt: now,
    };

    this.db
      .prepare(`
        insert into public_concierge_runs (
          id,
          targetId,
          scopeId,
          queryId,
          queryText,
          lineId,
          lineQuestion,
          userResponse,
          inputMode,
          status,
          progress,
          progressLabel,
          chairmanReply,
          nextLineQuestion,
          createdAt,
          updatedAt
        ) values (
          @id,
          @targetId,
          @scopeId,
          @queryId,
          @queryText,
          @lineId,
          @lineQuestion,
          @userResponse,
          @inputMode,
          @status,
          @progress,
          @progressLabel,
          @chairmanReply,
          @nextLineQuestion,
          @createdAt,
          @updatedAt
        )
      `)
      .run(row);

    return mapRunRow(row);
  }

  getRun(id: string): PublicConciergeRun | null {
    const row = this.db
      .prepare('select * from public_concierge_runs where id = ?')
      .get(id) as PublicConciergeRunRow | undefined;

    return row ? mapRunRow(row) : null;
  }

  private migrate() {
    this.db.exec(`
      create table if not exists public_concierge_runs (
        id text primary key,
        targetId text not null,
        scopeId text not null,
        queryId text not null,
        queryText text not null,
        lineId text not null,
        lineQuestion text not null,
        userResponse text not null,
        inputMode text not null,
        status text not null,
        progress real not null,
        progressLabel text not null,
        chairmanReply text not null,
        nextLineQuestion text not null,
        createdAt text not null,
        updatedAt text not null
      );

      create index if not exists public_concierge_runs_query_idx
        on public_concierge_runs(queryId, createdAt desc);

      create index if not exists public_concierge_runs_target_idx
        on public_concierge_runs(targetId, createdAt desc);
    `);
  }
}

let sharedRuns: PublicConciergeRuns | null = null;

export function getPublicConciergeRuns() {
  sharedRuns ??= new PublicConciergeRuns();
  return sharedRuns;
}

export function publicConciergeRunResponse(run: PublicConciergeRun) {
  return PublicConciergeRunResponseSchema.parse({ run });
}

function mapRunRow(row: PublicConciergeRunRow): PublicConciergeRun {
  return PublicConciergeRunSchema.parse(row);
}

function chairmanReplyFor(request: PublicConciergeRunRequest) {
  return `Captured. I will keep that with this Line: ${request.lineQuestion}`;
}
