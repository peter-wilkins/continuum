# Issue 023: Add Public Continuum Smoke Check

Status: done

## Goal

Make the public MVP API easy to verify with one command.

## Scope

- Add a backend smoke script for the Ada public Continuum.
- Check the public Continuum response shape, event count, Lens output count, and feedback summary endpoint.

## Acceptance Criteria

- [x] `npm run smoke:public-continuum --workspace backend` exits successfully.
- [x] The smoke check validates at least 4 public events.
- [x] The smoke check validates 3 Lens outputs.
- [x] The smoke check validates the feedback summary response.
