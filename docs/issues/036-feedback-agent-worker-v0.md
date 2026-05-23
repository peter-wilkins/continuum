# 036: Feedback Agent Worker V0

Status: ready

Type: AFK

## Parent

[031: Feedback Threads And Clarifications](031-feedback-threads-and-clarifications.md)

## What to build

Create the first local Feedback Agent worker.

The worker should process queued feedback messages one at a time under a lock. It should use a dedicated Feedback Agent session or fresh `codex exec` process according to the chosen local mechanism, but it must not resume the main Peter/Continuum conversation automatically.

The worker should classify each item into one of the V0 outcomes:

- fixed directly
- clarification requested
- escalated for Peter/main session
- parked as not actionable

For direct fixes, it should verify, commit, push, and append a resolution message to the Feedback Thread. For clarification, it should append an agent question and mark the thread `awaiting_user`.

## Acceptance criteria

- [ ] Worker processes at most one feedback item at a time using a lock.
- [ ] Worker does not resume the main interactive Codex session.
- [ ] Worker archives or marks queue messages only after writing a thread outcome.
- [ ] A dry-run mode shows intended classification without modifying files.
- [ ] A small safe fixture item can be processed end-to-end in a smoke test without touching real queued feedback.
- [ ] Hard or ambiguous fixture feedback becomes an escalation, not an unsafe automatic change.
- [ ] Worker instructions tell the agent to keep fixes small, local, verified, committed, and pushed.

## Blocked by

- [034: Agent Clarification API And Open Thread Query](034-agent-clarification-api-and-open-thread-query.md)
