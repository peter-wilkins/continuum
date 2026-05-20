-- Track transcription spend estimates per authenticated user.
--
-- OpenAI reports usage externally, but this table gives the app its own
-- daily budget gate and per-user cost view.

create table if not exists continuum.transcription_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  model text not null,
  language text not null,
  duration_ms integer not null,
  billed_seconds integer not null,
  estimated_cost_usd numeric(12, 6) not null,
  audio_size_bytes integer not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint transcription_usage_model_not_blank check (length(trim(model)) > 0),
  constraint transcription_usage_language_not_blank check (length(trim(language)) > 0),
  constraint transcription_usage_duration_positive check (duration_ms > 0),
  constraint transcription_usage_billed_seconds_positive check (billed_seconds > 0),
  constraint transcription_usage_estimated_cost_non_negative check (estimated_cost_usd >= 0),
  constraint transcription_usage_audio_size_positive check (audio_size_bytes > 0),
  constraint transcription_usage_metadata_is_object check (jsonb_typeof(metadata) = 'object')
);

create index if not exists transcription_usage_user_created_at_idx
  on continuum.transcription_usage (user_id, created_at desc);

alter table continuum.transcription_usage enable row level security;

drop policy if exists "authenticated users select own transcription usage" on continuum.transcription_usage;
create policy "authenticated users select own transcription usage"
  on continuum.transcription_usage
  for select
  to authenticated
  using (user_id = auth.uid());

revoke all on continuum.transcription_usage from anon;

grant select on continuum.transcription_usage to authenticated;

grant all on continuum.transcription_usage to service_role;
