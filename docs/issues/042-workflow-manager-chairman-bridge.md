# 042: Workflow Manager Chairman Bridge

Status: ready

Type: AFK

## What to build

Wire the phone-first Continuum Chairman loop to the existing Workflow Manager Bridge contract instead of duplicating Chairman routing inside Continuum.

Stable Continuum contract:

```text
Continuum PWA
-> send message event
-> read Journey State projection
```

Workflow Manager owns the dev-time machinery behind that membrane:

```text
Bridge inbox event
-> dev-only tmux/Codex Chairman adapter
-> Bridge outbox event
-> Journey State projection
```

The app must not know about tmux, Codex resume hashes, live agent sessions, or which agent handles the request. It only sends events and renders the projection.

This lets us bootstrap the product with a live agent during development while keeping the product architecture open to later adapters: cheap worker, deep agent, deterministic fake, parked clarification, or production service.

## Existing Contract To Reuse

Workflow Manager already documents the event shape in:

```text
/home/peter/workflow-manager/docs/phone-bridge-events.md
```

Relevant implementation:

```text
/home/peter/workflow-manager/scripts/phone_bridge.py
/home/peter/workflow-manager/scripts/phone_bridge_http.py
/home/peter/workflow-manager/scripts/phone_chairman_watcher.py
```

Current schemas:

- `workflow-manager.phone-inbox-message.v1`
- `workflow-manager.phone-outbox-message.v1`
- `workflow-manager.phone-journey-state.v1`

## Acceptance Criteria

- [ ] Continuum has a TypeScript representation of the Workflow Manager Bridge event/projection contract.
- [ ] The public Chairman Send path can post a `user_message` to the Bridge instead of only writing Continuum-local SQLite.
- [ ] The app can fetch and render `workflow-manager.phone-journey-state.v1` for the current browser/device.
- [ ] The deterministic local `Captured...` path remains available as a fake/fallback for tests or Bridge downtime.
- [ ] Continuum UI does not mention or depend on tmux, Codex sessions, resume hashes, or a specific live agent.
- [ ] Dev docs name the Workflow Manager side as a dev-only Chairman adapter, not product architecture.
- [ ] Backend or frontend smoke coverage proves: send message -> receive waiting/projection state.
- [ ] Phone QA verifies one message can go through the Bridge and show a phone-visible response/progress state.

## Non-Goals

- Do not build journey history/switching in this issue.
- Do not move Workflow Manager bridge code into Continuum.
- Do not make the app execute shell commands or expose privileged actions.
- Do not treat Workflow Manager local files as durable user memory.

## Follow-Up

After this bridge is wired, create a new smaller issue for Journey History/Switcher if it still feels necessary.
