-- Living Water Skills logbook prototype schema.
--
-- Separate prototype schema for a handbook-driven progress tracker. Public
-- handbook rows are readable so a static app can show the scheme. Personal
-- logbook/progress/permission rows require an authenticated Supabase user.

create schema if not exists living_water_skills;

grant usage on schema living_water_skills to anon, authenticated;

create table if not exists living_water_skills.handbook_versions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  status text not null default 'draft',
  summary text not null,
  created_at timestamptz not null default now(),

  constraint handbook_versions_code_not_blank check (length(trim(code)) > 0),
  constraint handbook_versions_title_not_blank check (length(trim(title)) > 0),
  constraint handbook_versions_status_check check (status in ('draft', 'active', 'retired')),
  constraint handbook_versions_summary_not_blank check (length(trim(summary)) > 0)
);

create table if not exists living_water_skills.awards (
  id uuid primary key default gen_random_uuid(),
  handbook_version_id uuid not null references living_water_skills.handbook_versions(id) on delete cascade,
  path text not null,
  code text not null,
  sort_order integer not null,
  title text not null,
  ability_statement text not null,
  evidence_summary text not null,
  unlocks text[] not null default '{}',
  requires_review boolean not null default true,

  constraint awards_path_check check (path in ('adult', 'youth', 'practitioner')),
  constraint awards_code_not_blank check (length(trim(code)) > 0),
  constraint awards_sort_positive check (sort_order > 0),
  constraint awards_title_not_blank check (length(trim(title)) > 0),
  constraint awards_ability_not_blank check (length(trim(ability_statement)) > 0),
  constraint awards_evidence_not_blank check (length(trim(evidence_summary)) > 0),
  constraint awards_unique_code unique (handbook_version_id, path, code)
);

create table if not exists living_water_skills.capabilities (
  id uuid primary key default gen_random_uuid(),
  handbook_version_id uuid not null references living_water_skills.handbook_versions(id) on delete cascade,
  code text not null,
  title text not null,
  description text not null,
  sort_order integer not null,

  constraint capabilities_code_not_blank check (length(trim(code)) > 0),
  constraint capabilities_title_not_blank check (length(trim(title)) > 0),
  constraint capabilities_description_not_blank check (length(trim(description)) > 0),
  constraint capabilities_sort_positive check (sort_order > 0),
  constraint capabilities_unique_code unique (handbook_version_id, code)
);

create table if not exists living_water_skills.tasks (
  id uuid primary key default gen_random_uuid(),
  award_id uuid not null references living_water_skills.awards(id) on delete cascade,
  capability_id uuid references living_water_skills.capabilities(id) on delete set null,
  title text not null,
  instructions text not null,
  evidence_kind text not null,
  risk_level text not null default 'low',
  sort_order integer not null,

  constraint tasks_title_not_blank check (length(trim(title)) > 0),
  constraint tasks_instructions_not_blank check (length(trim(instructions)) > 0),
  constraint tasks_evidence_kind_check check (
    evidence_kind in (
      'photo',
      'voice_note',
      'text_note',
      'map',
      'checklist',
      'permission_record',
      'mentor_signoff',
      'story_card'
    )
  ),
  constraint tasks_risk_level_check check (risk_level in ('low', 'moderate', 'high', 'expert_only')),
  constraint tasks_sort_positive check (sort_order > 0)
);

create table if not exists living_water_skills.learner_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade default auth.uid(),
  display_name text not null default 'Learner',
  primary_path text not null default 'adult',
  current_award_id uuid references living_water_skills.awards(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint learner_profiles_display_name_not_blank check (length(trim(display_name)) > 0),
  constraint learner_profiles_primary_path_check check (primary_path in ('adult', 'youth', 'practitioner'))
);

create table if not exists living_water_skills.sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  site_type text not null default 'water_place',
  location_label text not null default '',
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  privacy text not null default 'private',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint sites_name_not_blank check (length(trim(name)) > 0),
  constraint sites_type_check check (site_type in ('water_place', 'garden', 'farm', 'school', 'woodland', 'river', 'wetland', 'other')),
  constraint sites_privacy_check check (privacy in ('private', 'group', 'public_candidate'))
);

create table if not exists living_water_skills.evidence_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  site_id uuid references living_water_skills.sites(id) on delete set null,
  task_id uuid references living_water_skills.tasks(id) on delete set null,
  evidence_kind text not null,
  title text not null,
  body text not null default '',
  captured_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint evidence_items_kind_check check (
    evidence_kind in (
      'photo',
      'voice_note',
      'text_note',
      'map',
      'checklist',
      'permission_record',
      'mentor_signoff',
      'story_card'
    )
  ),
  constraint evidence_items_title_not_blank check (length(trim(title)) > 0),
  constraint evidence_items_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table if not exists living_water_skills.progress_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  award_id uuid not null references living_water_skills.awards(id) on delete cascade,
  status text not null default 'not_started',
  started_at timestamptz,
  ready_for_review_at timestamptz,
  signed_off_at timestamptz,
  notes text not null default '',

  constraint progress_records_status_check check (status in ('not_started', 'in_progress', 'ready_for_review', 'signed_off', 'paused')),
  constraint progress_records_user_award_unique unique (user_id, award_id)
);

create table if not exists living_water_skills.permission_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  site_id uuid references living_water_skills.sites(id) on delete set null,
  permission_type text not null,
  status text not null default 'needed',
  scope text not null default '',
  granted_by text not null default '',
  valid_from date,
  valid_until date,
  evidence_item_id uuid references living_water_skills.evidence_items(id) on delete set null,
  notes text not null default '',
  created_at timestamptz not null default now(),

  constraint permission_records_type_check check (
    permission_type in (
      'land_access',
      'public_share',
      'tool_use',
      'machinery_use',
      'water_work',
      'youth_safeguarding',
      'group_event'
    )
  ),
  constraint permission_records_status_check check (status in ('needed', 'requested', 'granted', 'denied', 'expired', 'not_applicable'))
);

create table if not exists living_water_skills.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  award_id uuid references living_water_skills.awards(id) on delete set null,
  evidence_item_id uuid references living_water_skills.evidence_items(id) on delete set null,
  reviewer_label text not null default '',
  status text not null default 'needs_review',
  comments text not null default '',
  created_at timestamptz not null default now(),

  constraint reviews_status_check check (status in ('needs_review', 'changes_requested', 'approved', 'rejected'))
);

create table if not exists living_water_skills.story_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  site_id uuid references living_water_skills.sites(id) on delete set null,
  title text not null,
  private_draft text not null default '',
  public_candidate text not null default '',
  publication_status text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint story_cards_title_not_blank check (length(trim(title)) > 0),
  constraint story_cards_publication_status_check check (publication_status in ('private', 'needs_redaction', 'public_candidate', 'published'))
);

alter table living_water_skills.handbook_versions enable row level security;
alter table living_water_skills.awards enable row level security;
alter table living_water_skills.capabilities enable row level security;
alter table living_water_skills.tasks enable row level security;
alter table living_water_skills.learner_profiles enable row level security;
alter table living_water_skills.sites enable row level security;
alter table living_water_skills.evidence_items enable row level security;
alter table living_water_skills.progress_records enable row level security;
alter table living_water_skills.permission_records enable row level security;
alter table living_water_skills.reviews enable row level security;
alter table living_water_skills.story_cards enable row level security;

drop policy if exists handbook_versions_public_read on living_water_skills.handbook_versions;
create policy handbook_versions_public_read
  on living_water_skills.handbook_versions
  for select
  to anon, authenticated
  using (true);

drop policy if exists awards_public_read on living_water_skills.awards;
create policy awards_public_read
  on living_water_skills.awards
  for select
  to anon, authenticated
  using (true);

drop policy if exists capabilities_public_read on living_water_skills.capabilities;
create policy capabilities_public_read
  on living_water_skills.capabilities
  for select
  to anon, authenticated
  using (true);

drop policy if exists tasks_public_read on living_water_skills.tasks;
create policy tasks_public_read
  on living_water_skills.tasks
  for select
  to anon, authenticated
  using (true);

drop policy if exists learner_profiles_select_own on living_water_skills.learner_profiles;
create policy learner_profiles_select_own
  on living_water_skills.learner_profiles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists learner_profiles_insert_own on living_water_skills.learner_profiles;
create policy learner_profiles_insert_own
  on living_water_skills.learner_profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists learner_profiles_update_own on living_water_skills.learner_profiles;
create policy learner_profiles_update_own
  on living_water_skills.learner_profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists sites_select_own on living_water_skills.sites;
create policy sites_select_own on living_water_skills.sites for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists sites_insert_own on living_water_skills.sites;
create policy sites_insert_own on living_water_skills.sites for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists sites_update_own on living_water_skills.sites;
create policy sites_update_own on living_water_skills.sites for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists sites_delete_own on living_water_skills.sites;
create policy sites_delete_own on living_water_skills.sites for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists evidence_items_select_own on living_water_skills.evidence_items;
create policy evidence_items_select_own on living_water_skills.evidence_items for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists evidence_items_insert_own on living_water_skills.evidence_items;
create policy evidence_items_insert_own on living_water_skills.evidence_items for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists evidence_items_update_own on living_water_skills.evidence_items;
create policy evidence_items_update_own on living_water_skills.evidence_items for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists evidence_items_delete_own on living_water_skills.evidence_items;
create policy evidence_items_delete_own on living_water_skills.evidence_items for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists progress_records_select_own on living_water_skills.progress_records;
create policy progress_records_select_own on living_water_skills.progress_records for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists progress_records_insert_own on living_water_skills.progress_records;
create policy progress_records_insert_own on living_water_skills.progress_records for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists progress_records_update_own on living_water_skills.progress_records;
create policy progress_records_update_own on living_water_skills.progress_records for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists progress_records_delete_own on living_water_skills.progress_records;
create policy progress_records_delete_own on living_water_skills.progress_records for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists permission_records_select_own on living_water_skills.permission_records;
create policy permission_records_select_own on living_water_skills.permission_records for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists permission_records_insert_own on living_water_skills.permission_records;
create policy permission_records_insert_own on living_water_skills.permission_records for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists permission_records_update_own on living_water_skills.permission_records;
create policy permission_records_update_own on living_water_skills.permission_records for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists permission_records_delete_own on living_water_skills.permission_records;
create policy permission_records_delete_own on living_water_skills.permission_records for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists reviews_select_own on living_water_skills.reviews;
create policy reviews_select_own on living_water_skills.reviews for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists reviews_insert_own on living_water_skills.reviews;
create policy reviews_insert_own on living_water_skills.reviews for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists reviews_update_own on living_water_skills.reviews;
create policy reviews_update_own on living_water_skills.reviews for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists reviews_delete_own on living_water_skills.reviews;
create policy reviews_delete_own on living_water_skills.reviews for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists story_cards_select_own on living_water_skills.story_cards;
create policy story_cards_select_own on living_water_skills.story_cards for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists story_cards_insert_own on living_water_skills.story_cards;
create policy story_cards_insert_own on living_water_skills.story_cards for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists story_cards_update_own on living_water_skills.story_cards;
create policy story_cards_update_own on living_water_skills.story_cards for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists story_cards_delete_own on living_water_skills.story_cards;
create policy story_cards_delete_own on living_water_skills.story_cards for delete to authenticated using ((select auth.uid()) = user_id);

grant select on
  living_water_skills.handbook_versions,
  living_water_skills.awards,
  living_water_skills.capabilities,
  living_water_skills.tasks
to anon, authenticated;

grant select, insert, update, delete on
  living_water_skills.learner_profiles,
  living_water_skills.sites,
  living_water_skills.evidence_items,
  living_water_skills.progress_records,
  living_water_skills.permission_records,
  living_water_skills.reviews,
  living_water_skills.story_cards
to authenticated;

revoke all on
  living_water_skills.learner_profiles,
  living_water_skills.sites,
  living_water_skills.evidence_items,
  living_water_skills.progress_records,
  living_water_skills.permission_records,
  living_water_skills.reviews,
  living_water_skills.story_cards
from anon;

grant usage on schema living_water_skills to service_role;
grant all on all tables in schema living_water_skills to service_role;

create index if not exists awards_handbook_path_sort_idx on living_water_skills.awards(handbook_version_id, path, sort_order);
create index if not exists capabilities_handbook_sort_idx on living_water_skills.capabilities(handbook_version_id, sort_order);
create index if not exists tasks_award_sort_idx on living_water_skills.tasks(award_id, sort_order);
create index if not exists sites_user_updated_idx on living_water_skills.sites(user_id, updated_at desc);
create index if not exists evidence_items_user_captured_idx on living_water_skills.evidence_items(user_id, captured_at desc);
create index if not exists progress_records_user_award_idx on living_water_skills.progress_records(user_id, award_id);
create index if not exists permission_records_user_status_idx on living_water_skills.permission_records(user_id, status);

insert into living_water_skills.handbook_versions (code, title, status, summary)
values (
  'lws-draft-2026-05-30',
  'Living Water Skills Draft Handbook',
  'draft',
  'First RYA-inspired pathway for practical water-cycle restoration learning, evidence, permissions, and story capture.'
)
on conflict (code) do update
set title = excluded.title,
    status = excluded.status,
    summary = excluded.summary;

with handbook as (
  select id from living_water_skills.handbook_versions where code = 'lws-draft-2026-05-30'
)
insert into living_water_skills.capabilities (handbook_version_id, code, title, description, sort_order)
select handbook.id, code, title, description, sort_order
from handbook,
(values
  ('observation', 'Observation', 'Seeing water, landform, vegetation, soil, disturbance, and change over time.', 1),
  ('safety_permission', 'Safety and Permission', 'Knowing what not to do, where not to go, and who must approve each kind of action.', 2),
  ('mapping_context', 'Mapping and Context', 'Placing a site in its catchment, land-use, access, and community context.', 3),
  ('water_literacy', 'Water Literacy', 'Understanding slow it, spread it, sink it, cycle it, plus flood, drought, pollution, and fire links.', 4),
  ('action_maintenance', 'Action and Maintenance', 'Low-risk stewardship, care over time, monitoring, and maintenance.', 5),
  ('story_evidence', 'Story and Evidence', 'Before/after, failures, photos, measurements, honest uncertainty, and public trust.', 6)
) as c(code, title, description, sort_order)
on conflict (handbook_version_id, code) do update
set title = excluded.title,
    description = excluded.description,
    sort_order = excluded.sort_order;

with handbook as (
  select id from living_water_skills.handbook_versions where code = 'lws-draft-2026-05-30'
)
insert into living_water_skills.awards (
  handbook_version_id,
  path,
  code,
  sort_order,
  title,
  ability_statement,
  evidence_summary,
  unlocks
)
select handbook.id, path, code, sort_order, title, ability_statement, evidence_summary, unlocks
from handbook,
(values
  ('adult', 'L1', 1, 'Water Awareness', 'Can safely observe a site and explain basic water-cycle restoration ideas.', 'Observation log, photo set, rainfall/runoff note, and basic safety reflection.', array['L2 Site Reader']),
  ('adult', 'L2', 2, 'Site Reader', 'Can make a simple site reading: catchment context, flow paths, erosion risk, vegetation, and human constraints.', 'Site-reading checklist, annotated map, opportunities and risks note.', array['L3 Action Steward']),
  ('adult', 'L3', 3, 'Action Steward', 'Can plan and lead low-risk stewardship actions with appropriate local permission and guidance.', 'Task plan, risk check, permission record, before/after evidence, and reflection.', array['Advanced modules']),
  ('youth', 'S1', 1, 'Notice Water', 'Can identify where water comes from, where it goes, and simple signs of wet, dry, erosion, and pollution.', 'Photo walk, voice note, simple map, what changed after rain.', array['S2 Read A Place']),
  ('youth', 'S2', 2, 'Read A Place', 'Can describe land shape, flow paths, soil cover, vegetation, and human modifications.', 'Before/after rain observations, annotated photos, simple sketch map.', array['S3 Help A Survey']),
  ('youth', 'S3', 3, 'Help A Survey', 'Can support a supervised habitat or water survey safely and consistently.', 'Completed survey task, safety check, mentor sign-off.', array['S4 Steward A Spot']),
  ('youth', 'S4', 4, 'Steward A Spot', 'Can help monitor one small site over time and explain its story to others.', 'Repeated logs, seasonal comparison, story card, group reflection.', array['Advanced modules']),
  ('practitioner', 'AG', 1, 'Assistant Guide', 'Helps run walks and surveys under a Guide; cannot sign off independent action.', 'Group session record and Guide confirmation.', array['Guide']),
  ('practitioner', 'G', 2, 'Guide', 'Can teach foundation stages and sign off observation and survey evidence within scope.', 'Teaching log, safeguarding/permission record, supervised sign-off.', array['Steward Coach']),
  ('practitioner', 'SC', 3, 'Steward Coach', 'Mentors Level 3 action stewardship and supervises low-risk local projects.', 'Reviewed project plans, permission records, evidence packs.', array['Design Reviewer'])
) as a(path, code, sort_order, title, ability_statement, evidence_summary, unlocks)
on conflict (handbook_version_id, path, code) do update
set sort_order = excluded.sort_order,
    title = excluded.title,
    ability_statement = excluded.ability_statement,
    evidence_summary = excluded.evidence_summary,
    unlocks = excluded.unlocks;

delete from living_water_skills.tasks
where award_id in (
  select id from living_water_skills.awards
  where handbook_version_id = (
    select id from living_water_skills.handbook_versions where code = 'lws-draft-2026-05-30'
  )
);

with caps as (
  select code, id from living_water_skills.capabilities
), awards as (
  select code, id from living_water_skills.awards
)
insert into living_water_skills.tasks (award_id, capability_id, title, instructions, evidence_kind, risk_level, sort_order)
values
  ((select id from awards where code = 'L1'), (select id from caps where code = 'observation'), 'Walk the site after rain', 'Record where water appears, moves, pools, dries, or causes damage. Capture at least three observations.', 'photo', 'low', 1),
  ((select id from awards where code = 'L1'), (select id from caps where code = 'safety_permission'), 'Do the no-disturbance safety check', 'Write down access constraints, obvious hazards, and what you are not allowed to touch yet.', 'checklist', 'low', 2),
  ((select id from awards where code = 'L1'), (select id from caps where code = 'story_evidence'), 'Make a first story card', 'Summarise what you saw without claiming a solution. Include uncertainty and one next question.', 'story_card', 'low', 3),
  ((select id from awards where code = 'L2'), (select id from caps where code = 'mapping_context'), 'Sketch the catchment context', 'Annotate a simple map with inflows, outflows, slopes, surfaces, drains, paths, and boundaries.', 'map', 'low', 1),
  ((select id from awards where code = 'L3'), (select id from caps where code = 'safety_permission'), 'Record permissions before action', 'Capture land access, public sharing, tool use, machinery use, and water-work permissions before doing anything physical.', 'permission_record', 'moderate', 1),
  ((select id from awards where code = 'S1'), (select id from caps where code = 'observation'), 'Notice water signs', 'Take a short photo walk and name three signs of wet, dry, erosion, pollution, vegetation, or wildlife.', 'photo', 'low', 1),
  ((select id from awards where code = 'S4'), (select id from caps where code = 'story_evidence'), 'Tell the place story', 'Use repeated observations to explain how one place changes over time.', 'story_card', 'low', 1);

comment on schema living_water_skills is
  'Prototype schema for Living Water Skills handbook, progress tracking, evidence, permissions, and story cards.';

comment on table living_water_skills.permission_records is
  'Tracks land access, public sharing, tool use, machinery use, water work, safeguarding, and group-event permissions. Machinery/use permissions are explicit because they must not be inferred from progress.';
