# 033: Show Feedback Thread Confirmation

Status: ready

Type: AFK

## Parent

[031: Feedback Threads And Clarifications](031-feedback-threads-and-clarifications.md)

## What to build

Make the user-visible feedback confirmation thread-aware.

After feedback is sent, the panel should show that the report started a private Feedback Thread. It should not expose internal queue details, but it should make clear that follow-up can appear in the same feedback surface later.

This is a small UX slice that proves the app can hold onto thread identity without yet implementing agent clarification.

## Acceptance criteria

- [ ] The feedback panel receives and stores the returned Feedback Thread id for the current device session.
- [ ] Successful submission copy says the report was sent and that follow-up may appear here.
- [ ] The panel can be reopened after submission without losing the last sent thread status during the same app session.
- [ ] Existing Lens feedback and sign-in flows still work.
- [ ] Typecheck and public Continuum smoke checks pass.

## Blocked by

- [032: Create Feedback Thread On Report](032-create-feedback-thread-on-report.md)
