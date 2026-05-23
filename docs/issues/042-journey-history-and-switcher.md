# 042: Journey History And Switcher

Status: ready

Type: AFK

## What to build

Build the next phone-first navigation slice for Concierge Thought Journeys:

```text
current query / Line
-> visible recent Journeys
-> tap a previous Journey
-> restore its query, answer, Line, progress, and latest Chairman reply
```

This follows `041`, which proved the first live Chairman loop. This issue is about making interruptions first-class in the UI instead of relying on browser history or manual URLs.

## Acceptance criteria

- [ ] The public answer page exposes a small phone-friendly way to view recent Journeys for this browser/device.
- [ ] Recent Journeys are scoped to the same `clientInstanceId`, not global public data.
- [ ] Each recent item shows enough context to recognize it: query text, Line, rough progress, and last updated time.
- [ ] Tapping a recent Journey restores its query, sourced answer, Chairman Line, progress, and latest `Heard` reply.
- [ ] The current Journey remains full-screen and uncluttered when the switcher is closed.
- [ ] Backend smoke coverage verifies listing recent Journeys for one client without leaking another client.
- [ ] Phone QA verifies jumping between at least two Journeys without losing either latest reply.

## Notes

Keep this as a local workbench feature for the MVP. Do not describe backend-local SQLite rows as durable user memory.
