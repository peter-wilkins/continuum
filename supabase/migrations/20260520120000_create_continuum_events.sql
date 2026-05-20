-- Continuum MVP schema.
--
-- MVP mode: prototype data is disposable. Keep the schema clear and small.
-- Durable source material starts here: authenticated transcript events with
-- rich JSONB metadata.

create schema if not exists continuum;

create table if not exists continuum.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null default 'speech',
  transcript text not null,
  client_created_at timestamptz not null,
  server_created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,

  constraint events_transcript_not_blank check (length(trim(transcript)) > 0),
  constraint events_metadata_is_object check (jsonb_typeof(metadata) = 'object'),
  constraint events_source_not_blank check (length(trim(source)) > 0)
);

create index if not exists events_user_server_created_at_idx
  on continuum.events (user_id, server_created_at desc);

create index if not exists events_user_client_created_at_idx
  on continuum.events (user_id, client_created_at desc);

alter table continuum.events enable row level security;

drop policy if exists "authenticated users insert own events" on continuum.events;
create policy "authenticated users insert own events"
  on continuum.events
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "authenticated users select own events" on continuum.events;
create policy "authenticated users select own events"
  on continuum.events
  for select
  to authenticated
  using (user_id = auth.uid());

revoke all on schema continuum from anon;
revoke all on continuum.events from anon;

grant usage on schema continuum to authenticated;
grant select, insert on continuum.events to authenticated;

grant usage on schema continuum to service_role;
grant all on continuum.events to service_role;
