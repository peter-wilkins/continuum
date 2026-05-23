# 037: Feedback Identity Upgrade Smoke

Status: ready

Type: HITL

## Parent

[031: Feedback Threads And Clarifications](031-feedback-threads-and-clarifications.md)

## What to build

Test and document the expected feedback identity upgrade path.

Before login, a device should be able to create private Feedback Threads using its stable local feedback identity. After login, Supabase identity should be attached to new feedback and, where practical, linked to existing device-owned threads from the same browser/device.

This is a smoke-and-documentation slice. It is allowed to expose edge cases rather than fully solving them.

## Acceptance criteria

- [ ] Manual or automated smoke covers logged-out feedback thread creation.
- [ ] Manual or automated smoke covers logging in on the same browser/device after feedback creation.
- [ ] New logged-in feedback includes Supabase user identity.
- [ ] Existing same-device anonymous thread ownership behaviour is documented.
- [ ] Known edge cases are recorded: storage reset, cross-device login, shared device, failed auth callback.
- [ ] Any required Supabase schema or policy changes are deferred into a separate release issue if needed.

## Blocked by

- [032: Create Feedback Thread On Report](032-create-feedback-thread-on-report.md)
- [035: Feedback Panel Open Question Reply](035-feedback-panel-open-question-reply.md)
