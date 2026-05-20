# Issue 001: Supabase Continuum Schema

## Goal

Create the smallest runtime database surface for Continuum in the shared Supabase project.

## Scope

- Create PostgreSQL schema `continuum`.
- Create one append-only table: `continuum.events`.
- Store transcript text as durable source material.
- Store rich capture context in `metadata jsonb`.
- Associate events with authenticated Supabase users.
- Avoid creating Continuum tables in `public`.

## Acceptance Criteria

- [x] SQL migration exists in the repo.
- [x] `continuum.events` can store authenticated transcript events.
- [x] Events include server timestamp, client timestamp, source, transcript, and metadata.
- [x] App/backend code only inserts events; no update/delete path exists in the MVP.

## Verification

- [x] Migration has been applied to the shared Supabase database.
- [x] Schema, table, RLS, and policies have been verified against Supabase.
- [x] Authenticated insert/select has been tested through the application/backend.

## Out Of Scope

- Threads.
- Summaries.
- Embeddings.
- Retrieval tables.
- Snapshot tables.
- Multi-prototype schema migration tooling.
