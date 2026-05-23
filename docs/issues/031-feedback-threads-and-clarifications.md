# 031: Feedback Threads And Clarifications

Status: planning

## Context

The current `/api/devops-feedback` path is a one-shot report: the public app writes one JSON message into the local agent queue and a Feedback Agent or the main agent can act on it.

That is enough for tiny fixes, but it breaks down when triage needs one more piece of information from the user. The agent should not block waiting for the user, and the user should not need to leave the app or remember to open a separate support channel.

## Product Decision

Feedback becomes a private Feedback Thread rather than a fire-and-forget report.

A Feedback Thread is a sandboxed app-development loop between:

- the user or device that sent the feedback
- the Feedback Agent
- later, the main Continuum development flow when an item needs product judgement

Threads are private to the reporting user/device and the Feedback Agent by default.

Later, a thread may be explicitly promoted into a public or shared Continuum where people can discuss recurring issues, design choices, or product direction. Promotion is not part of the MVP and must be explicit because raw feedback can contain private context.

## Identity Model

Assumption for V0:

- before login, each browser/device has a stable local feedback identity
- clarification requests can be sent back to that device
- after login, Supabase identity linking should upgrade the thread from device identity to user identity
- this upgrade path is expected but not yet tested

Known edge cases are accepted for now:

- browser storage reset loses the anonymous device identity
- a user may send feedback on one device and log in on another
- login upgrade may not merge every old thread cleanly
- shared devices may blur who owns anonymous feedback

These are not blockers for the MVP because the first goal is to avoid losing clarification opportunities, not to build a complete support system.

## Feedback Thread Shape

Minimum conceptual records:

- Feedback Thread: id, owner identity or device identity, status, created time, updated time
- Feedback Message: thread id, sender, message kind, body, created time
- Clarification Request: an agent-authored Feedback Message that asks for missing information
- Resolution Message: records fixed, parked, issue-created, or not-reproducible outcomes

Initial statuses:

- `new`
- `triaging`
- `awaiting_user`
- `actionable`
- `fixed`
- `parked`

The Feedback Agent should never block on a user response. If it needs more information, it writes a Clarification Request, marks the thread `awaiting_user`, and moves on.

## UX Direction

The public app should make open questions visible without becoming a support dashboard.

V0 UX:

- feedback button remains at point of use
- menu shows a small badge when any private Feedback Thread is awaiting the current device/user
- feedback panel shows the active thread, agent question, and a reply box
- successful replies return to the current Continuum surface

No push notifications are required for V0.

## Agent Direction

The future Feedback Agent should classify each thread:

- small safe fix: implement, verify, commit, push, archive/resolution message
- simple but separable work: spawn a cheaper fresh agent or create a local issue
- unclear feedback: ask one clarification question and mark `awaiting_user`
- product/domain/taste decision: escalate to Peter/main Continuum session
- unsafe/destructive/external-service work: stop and request explicit approval

## Acceptance Criteria

- [ ] Backend can create a Feedback Thread for new feedback.
- [ ] Backend can append a user reply to an existing Feedback Thread.
- [ ] Backend can expose current-device/current-user open clarification threads.
- [ ] Feedback payload includes stable local device identity when logged out.
- [ ] Logged-in requests attach Supabase user identity when available.
- [ ] Feedback panel shows open agent questions and lets the user reply.
- [ ] Feedback Agent queue messages include thread id and requested action.
- [ ] Private thread data is not exposed across users/devices.
- [ ] Device-to-user upgrade is smoke-tested enough to document known limitations.

## Out Of Scope

- Public discussion spaces for feedback threads.
- Notifications.
- Full support-ticket management.
- GitHub issue automation before maintainer/agent triage.
- Perfect anonymous-to-logged-in identity merge.
