# 032: Create Feedback Thread On Report

Status: ready

Type: AFK

## Parent

[031: Feedback Threads And Clarifications](031-feedback-threads-and-clarifications.md)

## What to build

Turn the existing one-shot app feedback path into the first Feedback Thread slice.

When a user sends feedback from the public Continuum surface, the app should include a stable local feedback device identity. The backend should create a private Feedback Thread, append the first user Feedback Message, return the thread id to the app, and include that thread id in the agent queue message.

This should still feel like the current fast feedback UX: the user writes one short report and gets confirmation that it was sent.

Use local backend storage for this slice. Do not block on Supabase persistence yet.

## Acceptance criteria

- [ ] A logged-out browser/device has a stable local feedback identity that survives reloads.
- [ ] A logged-in user still sends the stable device identity, with auth status preserved in context.
- [ ] Submitting feedback creates one Feedback Thread and one user Feedback Message.
- [ ] The API response includes the Feedback Thread id.
- [ ] The queued agent message includes the Feedback Thread id and the original feedback context.
- [ ] Existing feedback smoke coverage is updated to verify thread creation and queue output.
- [ ] Private thread storage is local and gitignored.

## Blocked by

None - can start immediately.
