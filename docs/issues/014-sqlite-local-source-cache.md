# Issue 014: SQLite Local Source Cache

Status: done

## Goal

Add an app-side Local Source Cache backed by SQLite so imported Canonical Event JSONL can be
served quickly from local disk while remaining disposable and rebuildable.

## Type

AFK.

## Scope

- Add the SQLite dependency to the Continuum app only.
- Import `canonicalEventToLocalSourceCacheEventRow` and `type LocalSourceCacheEventRow` from
  `@continuum/core`; do not define an app-local row mapper.
- Store the local database at `data/local-source-cache.sqlite`.
- Ensure `data/` stays gitignored.
- Create tables:
  - `local_source_events`
  - `local_import_batches`
  - `local_import_batch_events`
  - `local_import_quarantine`
- Add indexes for event time, source platform, and batch event lookup.
- Use camelCase column names in SQLite to match `LocalSourceCacheEventRow`; table names remain
  snake_case.
- Load Canonical Event JSONL into the cache using the row contract from Continuum Core.
- Add backend endpoints for timeline, detail, and source-filter reads.
- Keep this as a local serving bridge, not the Source Log, Memory Layer, or future Arrow substrate.

## Acceptance Criteria

- [x] SQLite database file is created under gitignored `data/local-source-cache.sqlite`.
- [x] Cache rows are produced with `canonicalEventToLocalSourceCacheEventRow(event, ingestedAt)` from `@continuum/core`.
- [x] Schema includes `local_source_events`, `local_import_batches`, `local_import_batch_events`, and `local_import_quarantine`.
- [x] `local_source_events` includes flat serving columns plus full `eventJson`.
- [x] Indexes exist for `createdAt`, `sourcePlatform`, and `local_import_batch_events.eventId`.
- [x] Canonical Event JSONL can be loaded into the cache and associated with an import batch.
- [x] Invalid or unparseable rows are captured in `local_import_quarantine` without stopping the whole import.
- [x] Backend can serve timeline rows in reverse chronological order.
- [x] Backend can serve a detail view by cached event ID.
- [x] Backend can filter timeline reads by source platform.
- [x] No SQLite FTS is added in this first slice.

## Blocked By

- None. Core issue `../continuum-core/docs/issues/056-define-local-source-cache-row-contract.md`
  is complete.

## Out Of Scope

- Full-text search.
- Durable sync semantics.
- Treating SQLite as the canonical Source Log.
- Arrow or Parquet memory strata implementation.
- UI polish beyond enough visibility to verify timeline/detail/source-filter reads.
