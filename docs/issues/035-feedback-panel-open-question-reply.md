# 035: Feedback Panel Open Question Reply

Status: ready

Type: AFK

## Parent

[031: Feedback Threads And Clarifications](031-feedback-threads-and-clarifications.md)

## What to build

Complete the V0 user clarification loop in the public app.

When the backend reports an open clarification for the current device/user, the public app should show a small badge on the feedback/menu entry. Opening the feedback panel should show the agent question and a reply box. Sending a reply appends a user Feedback Message and returns the thread to a non-blocking state for agent triage.

This should stay lightweight: not a support inbox, not a dashboard.

## Acceptance criteria

- [ ] The public Continuum menu shows a small visible cue when an open clarification exists.
- [ ] The feedback panel shows the original report context and the latest agent question.
- [ ] The user can submit one reply from the panel.
- [ ] Submitting a reply appends a user Feedback Message to the existing thread.
- [ ] After reply, the open-question cue clears for that thread.
- [ ] Empty replies are rejected client-side and server-side.
- [ ] Mobile layout works at 360px width.

## Blocked by

- [034: Agent Clarification API And Open Thread Query](034-agent-clarification-api-and-open-thread-query.md)
