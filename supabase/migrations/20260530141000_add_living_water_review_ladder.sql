-- Review ladder for Living Water Skills.
--
-- Early stages can receive AI coaching and encouragement. Later stages move
-- toward peer, guide, steward-coach, or expert review. AI feedback is useful
-- but does not grant tool, machinery, youth, water-work, or sign-off authority.

alter table living_water_skills.reviews
  add column if not exists reviewer_kind text not null default 'ai',
  add column if not exists reviewer_user_id uuid references auth.users(id) on delete set null,
  add column if not exists review_scope text not null default 'encouragement',
  add column if not exists can_sign_off boolean not null default false;

alter table living_water_skills.reviews
  drop constraint if exists reviews_reviewer_kind_check,
  add constraint reviews_reviewer_kind_check check (
    reviewer_kind in ('ai', 'peer', 'assistant_guide', 'guide', 'steward_coach', 'design_reviewer', 'expert')
  );

alter table living_water_skills.reviews
  drop constraint if exists reviews_review_scope_check,
  add constraint reviews_review_scope_check check (
    review_scope in ('encouragement', 'evidence_check', 'award_signoff', 'permission_review', 'expert_review')
  );

create table if not exists living_water_skills.review_ladder_rules (
  id uuid primary key default gen_random_uuid(),
  handbook_version_id uuid not null references living_water_skills.handbook_versions(id) on delete cascade,
  path text not null,
  award_code text not null,
  ai_feedback_allowed boolean not null default true,
  peer_review_allowed boolean not null default false,
  required_reviewer_kind text not null default 'ai',
  minimum_reviewer_award_code text not null default '',
  signoff_allowed boolean not null default false,
  notes text not null default '',

  constraint review_ladder_path_check check (path in ('adult', 'youth', 'practitioner')),
  constraint review_ladder_award_code_not_blank check (length(trim(award_code)) > 0),
  constraint review_ladder_required_kind_check check (
    required_reviewer_kind in ('ai', 'peer', 'assistant_guide', 'guide', 'steward_coach', 'design_reviewer', 'expert')
  ),
  constraint review_ladder_unique_award unique (handbook_version_id, path, award_code)
);

alter table living_water_skills.review_ladder_rules enable row level security;

drop policy if exists review_ladder_rules_public_read on living_water_skills.review_ladder_rules;
create policy review_ladder_rules_public_read
  on living_water_skills.review_ladder_rules
  for select
  to anon, authenticated
  using (true);

grant select on living_water_skills.review_ladder_rules to anon, authenticated;
grant all on living_water_skills.review_ladder_rules to service_role;

with handbook as (
  select id from living_water_skills.handbook_versions where code = 'lws-draft-2026-05-30'
)
insert into living_water_skills.review_ladder_rules (
  handbook_version_id,
  path,
  award_code,
  ai_feedback_allowed,
  peer_review_allowed,
  required_reviewer_kind,
  minimum_reviewer_award_code,
  signoff_allowed,
  notes
)
select handbook.id, path, award_code, ai_feedback_allowed, peer_review_allowed,
       required_reviewer_kind, minimum_reviewer_award_code, signoff_allowed, notes
from handbook,
(values
  ('adult', 'L1', true, false, 'ai', '', false, 'AI can encourage and ask better observation questions; human sign-off can be added later if needed.'),
  ('adult', 'L2', true, true, 'peer', 'L3', true, 'AI can coach the draft; a peer or Guide should check site-reading evidence before sign-off.'),
  ('adult', 'L3', true, true, 'guide', 'AG', true, 'Action stewardship needs Guide or Steward Coach review, plus explicit permission records.'),
  ('youth', 'S1', true, false, 'ai', '', false, 'AI can encourage noticing and help turn observations into questions.'),
  ('youth', 'S2', true, true, 'peer', 'S4', true, 'Older/higher-stage peers can help review simple place-reading evidence under group rules.'),
  ('youth', 'S3', true, true, 'guide', 'AG', true, 'Survey help should be reviewed by a Guide or supervised Assistant Guide.'),
  ('youth', 'S4', true, true, 'guide', 'AG', true, 'Stewardship evidence needs Guide review before any public or group-facing claim.'),
  ('practitioner', 'AG', true, true, 'guide', 'G', true, 'Assistant Guides need Guide supervision.'),
  ('practitioner', 'G', true, true, 'steward_coach', 'SC', true, 'Guide progression needs Steward Coach review.'),
  ('practitioner', 'SC', true, true, 'design_reviewer', '', true, 'Steward Coach scope must escalate design/legal/ecology risk to qualified reviewers.')
) as rules(path, award_code, ai_feedback_allowed, peer_review_allowed, required_reviewer_kind, minimum_reviewer_award_code, signoff_allowed, notes)
on conflict (handbook_version_id, path, award_code) do update
set ai_feedback_allowed = excluded.ai_feedback_allowed,
    peer_review_allowed = excluded.peer_review_allowed,
    required_reviewer_kind = excluded.required_reviewer_kind,
    minimum_reviewer_award_code = excluded.minimum_reviewer_award_code,
    signoff_allowed = excluded.signoff_allowed,
    notes = excluded.notes;

comment on table living_water_skills.review_ladder_rules is
  'Defines when AI coaching, peer review, guide review, coach review, or expert review is appropriate for each handbook award.';

comment on column living_water_skills.reviews.can_sign_off is
  'True only when this review is allowed to change award/progress status. AI encouragement should normally leave this false.';
