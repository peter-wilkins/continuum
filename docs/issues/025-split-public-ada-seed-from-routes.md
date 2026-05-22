# Issue 025: Split Public Ada Seed From Routes

Status: done

## Goal

Keep the public Continuum HTTP routes small enough to extend when more public targets are added.

## Scope

- Move Ada scope, query, source fixtures, and Continuum construction into a dedicated backend module.
- Leave feedback routing and feedback log handling in the route module.
- Preserve the public API response shape and smoke-check behaviour.

## Acceptance Criteria

- [x] `publicContinuum.ts` owns HTTP routes and feedback log handling.
- [x] `publicAdaContinuum.ts` owns the Ada seed data and response construction.
- [x] The public Continuum smoke check still passes.
