# Issue 016: Public Extended Thought MVP

Status: ready

## Goal

Shift the app MVP from a private personal Continuum to a public, identity/topic Continuum that people can explore and give feedback on.

Example:

```text
Ada Lovelace
Ada Lovelace about computing
```

## Type

AFK.

## Scope

- Add an app-facing concept of a selected public Continuum target.
- Start with a single hard-coded public target if needed.
- Show imported public events as an inspectable Continuation surface.
- Keep provenance visible enough that users can understand where material came from.
- Add a lightweight feedback action on surfaced material.
- Do not require private Google/Email/Claude imports for the first public demo.

## Acceptance Criteria

- [ ] The app can represent a public Continuum target with identity and optional topic.
- [ ] The first target can be Ada Lovelace with topic `computing`.
- [ ] The UI does not describe the MVP as Peter's private personal memory app.
- [ ] The UI can show imported public events or a placeholder surface ready for them.
- [ ] Users can give at least one feedback signal on surfaced material.
- [ ] Private import/capture flows are not deleted, but they are not required for the public MVP path.

## Blocked By

- `../continuum-core/docs/issues/061-identity-first-public-import-scope.md`

## Out Of Scope

- Full public-source fetching.
- Entity resolution UI.
- Polished onboarding.
- Private memory import.
- Multi-user social features.
