# Issue 015: Curator Review Feedback UI

Status: ready

## Goal

Add the first app-side Curator review loop so Peter can give tiny feedback signals on imported or captured memory candidates.

This is the UI and persistence counterpart to `continuum-core` issue `059-record-curator-feedback-signals.md`. Core owns what feedback means. The Continuum app owns how the user gives that feedback and where app-specific feedback is stored.

## Type

AFK.

## Scope

- Add a small review feed for local source cache rows or captured thoughts.
- Show one memory candidate at a time.
- Provide low-friction actions such as keep / not useful / important / passing thought.
- Store each feedback action append-only in the app backend.
- Keep raw captured/imported data unchanged.
- Show enough local debug visibility to confirm feedback was recorded.
- Keep the interaction light enough to evolve toward swipe left/right or a compass-style review surface.

## Acceptance Criteria

- [ ] A backend endpoint records a Curator feedback signal for a candidate.
- [ ] Feedback persistence is append-only and does not mutate source events, local source cache rows, or transcripts.
- [ ] The UI presents one review candidate at a time.
- [ ] The user can record at least `keep` and `not_useful`.
- [ ] The UI can show that feedback was recorded for the candidate.
- [ ] The first UI does not require conversational chat, autonomous learning, or complex settings.
- [ ] The implementation can consume the core feedback type/helpers once core issue 059 is implemented.

## Blocked By

- `../continuum-core/docs/issues/059-record-curator-feedback-signals.md`

## Out Of Scope

- Polished swipe animation.
- Full compass UI.
- Autonomous learning.
- Re-ranking all memory.
- Turning feedback into tasks, reminders, or project labels.
