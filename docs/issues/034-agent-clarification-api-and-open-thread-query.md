# 034: Agent Clarification API And Open Thread Query

Status: ready

Type: AFK

## Parent

[031: Feedback Threads And Clarifications](031-feedback-threads-and-clarifications.md)

## What to build

Add the backend half of the clarification loop.

The Feedback Agent needs a local way to append an agent clarification question to an existing Feedback Thread and mark it `awaiting_user`. The app needs an API to ask whether the current device/user has any open clarification threads.

The Feedback Agent must not block waiting for the answer. It should be able to leave a question and move on.

## Acceptance criteria

- [ ] Backend can append an agent-authored clarification message to an existing thread.
- [ ] App-facing API lists only open clarification threads for the current feedback device identity and, when available, current Supabase user.
- [ ] Open clarification response includes thread id, original report summary, agent question, and created time.
- [ ] User data from other device identities is not returned.
- [ ] Smoke coverage creates a thread, appends a clarification, and reads it back through the open-thread query.
- [ ] Invalid or unknown thread ids are rejected without creating orphan messages.

## Blocked by

- [032: Create Feedback Thread On Report](032-create-feedback-thread-on-report.md)
