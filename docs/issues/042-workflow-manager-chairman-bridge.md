# 042: Workflow Manager Chairman Bridge

Status: in_progress

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

New routing/interceptor docs to honour:

- `/home/peter/workflow-manager/docs/bridge-membranes.md`
- Route envelope: `sender`, `membrane`, `target`, `journeyId`, `intent`.
- Continuum-origin messages should fill routing fields explicitly where possible instead of relying on Workflow Manager defaults.
- Private delivery plans stay behind the Bridge membrane. Continuum must never render or persist tmux session names, Codex resume hashes, or worker process names.
- V0 Bridge Policy Chain: `capture_raw`, `attach_identity`, `apply_frontend_preferences`, `rewrite_with_dictionary`, `check_confidence`, `resolve_route`, `deliver_to_destination`, `project_response`.
- Low-confidence or unmatched-route cases must fail closed and preserve the raw message.

## Acceptance Criteria

- [x] Continuum has a TypeScript representation of the Workflow Manager Bridge event/projection contract.
- [x] The public Chairman Send path can post a `user_message` to the Bridge instead of only writing Continuum-local SQLite.
- [x] The app can fetch and render `workflow-manager.phone-journey-state.v1` for the current browser/device.
- [x] The deterministic local `Captured...` path remains available as a fake/fallback for tests or Bridge downtime.
- [x] Continuum UI does not mention or depend on tmux, Codex sessions, resume hashes, or a specific live agent.
- [x] Dev docs name the Workflow Manager side as a dev-only Chairman adapter, not product architecture.
- [x] Backend or frontend smoke coverage proves: send message -> receive waiting/projection state.
- [ ] Phone QA verifies one message can go through the Bridge and show a phone-visible response/progress state.

## Non-Goals

- Do not build journey history/switching in this issue.
- Do not move Workflow Manager bridge code into Continuum.
- Do not make the app execute shell commands or expose privileged actions.
- Do not treat Workflow Manager local files as durable user memory.
- Do not activate runtime delivery until the Workflow Manager AFK router/interceptor work has a stable route to call.

## Implementation Notes

- 2026-05-24: Added shared Zod/TypeScript schemas for Workflow Manager inbox, outbox, journey-state, route envelope, private delivery plan, and V0 Bridge Policy Chain in `shared/src/workflowManagerBridge.ts`.
- The schemas deliberately model Workflow Manager as an external JSON boundary. Optional outbox/projection fields mirror the existing bridge log; Continuum should normalize before storing any internal state.
- 2026-05-24: Added an authenticated Continuum backend proxy for Workflow Manager Bridge `POST /v1/messages` and `GET /v1/journey-state`. Logged-in public Chairman sends try the Bridge first; logged-out users and Bridge failures still use the deterministic local fake.
- Local dev guard checked: unauthenticated Bridge proxy state request returns `401`, backend `/health` returns `200`, and Workflow Manager Bridge `/health` returns `{"ok": true}`.
- Added `npm run smoke:workflow-manager-bridge --workspace backend`, which uses a fake Bridge server to prove message posting returns a waiting projection and state fetching parses the Bridge projection.

## Follow-Up

After this bridge is wired, create a new smaller issue for Journey History/Switcher if it still feels necessary.
