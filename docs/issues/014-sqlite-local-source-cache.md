# Issue 014: SQLite Local Source Cache

## Goal

Add an app-side Local Source Cache backed by SQLite so imported Canonical Event JSONL can be
served quickly from local disk while remaining disposable and rebuildable.

## Type

AFK.

## Scope

- Add the SQLite dependency to the Continuum app only.
- Store the local database at `data/local-source-cache.sqlite`.
- Ensure `data/` stays gitignored.
- Create tables:
  - `local_source_events`
  - `local_import_batches`
  - `local_import_batch_events`
  - `local_import_quarantine`
- Add indexes for event time, source platform, and batch event lookup.
- Load Canonical Event JSONL into the cache using the row contract from Continuum Core.
- Add backend endpoints for timeline, detail, and source-filter reads.
- Keep this as a local serving bridge, not the Source Log, Memory Layer, or future Arrow substrate.

## Acceptance Criteria

- [ ] SQLite database file is created under gitignored `data/local-source-cache.sqlite`.
- [ ] Schema includes `local_source_events`, `local_import_batches`, `local_import_batch_events`, and `local_import_quarantine`.
- [ ] `local_source_events` includes flat serving columns plus full `event_json`.
- [ ] Indexes exist for `created_at`, `source_platform`, and `local_import_batch_events.event_id`.
- [ ] Canonical Event JSONL can be loaded into the cache and associated with an import batch.
- [ ] Invalid or unparseable rows are captured in `local_import_quarantine` without stopping the whole import.
- [ ] Backend can serve timeline rows in reverse chronological order.
- [ ] Backend can serve a detail view by cached event ID.
- [ ] Backend can filter timeline reads by source platform.
- [ ] No SQLite FTS is added in this first slice.

## Blocked By

- `../continuum-core/docs/issues/056-define-local-source-cache-row-contract.md`

## Out Of Scope

- Full-text search.
- Durable sync semantics.
- Treating SQLite as the canonical Source Log.
- Arrow or Parquet memory strata implementation.
- UI polish beyond enough visibility to verify timeline/detail/source-filter reads.
