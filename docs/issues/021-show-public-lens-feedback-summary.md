# Issue 021: Show Public Lens Feedback Summary

Status: done

## Goal

Make Lens feedback inspectable without exposing individual users.

## Scope

- Add a public aggregate feedback summary endpoint for the Ada Continuum.
- Read append-only Lens feedback from the local feedback log.
- Ignore invalid/corrupt feedback log lines.
- Show aggregate preference counts on each Lens card.

## Acceptance Criteria

- [x] The summary endpoint returns counts per active Lens output.
- [x] The summary endpoint does not expose user ids or emails.
- [x] The public Ada page shows preference counts when the summary loads.
- [x] Submitting feedback refreshes the visible counts.
