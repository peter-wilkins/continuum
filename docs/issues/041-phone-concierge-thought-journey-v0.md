# 041: Phone Concierge Thought Journey V0

Status: in_progress

Type: AFK

## What to build

Build the first phone-first Concierge loop:

```text
spoken or fallback query
-> Concierge run stored in backend-local disposable SQLite
-> sourced answer appears on phone
-> Why this? / Sources
-> one Chairman Line
-> coarse progress bar
-> user can jump away and resume this Journey later
```

This is not a generic chatbot. The Concierge does bounded legwork: gathers or prepares source-backed material. The Chairman model keeps the thinking path coherent: one active Line, parked Lines, Decisions/Open Threads later.

Bring SQLite back as an iteration workbench for this slice. It is useful because we will change what the Concierge fetches and how results are shaped. The local store should make it cheap to inspect, reset, and bin previous attempts while we learn.

SQLite remains a disposable local cache/projection, not source truth. Source truth still belongs to immutable source events and later durable Continuum storage.

Storage boundary: for this issue, SQLite means backend-local workbench storage in the Continuum app repo, not phone-local storage. Public demo queries may be cached there temporarily for iteration. The store must be resettable and must not be described as durable user memory.

Target user shape: people who switch topics often, but still want thoughts honoured instead of lost. A new thought can interrupt the current Journey, get its own rough progress, then the user can return to the previous Journey.

## Acceptance criteria

- [ ] The phone public MVP can start a Concierge Thought Journey from a spoken query or text fallback.
- [ ] Browser speech recognition is used first; raw audio is not stored.
- [ ] A Concierge run is written to backend-local SQLite with query text, status, creation time, update time, and result payload.
- [ ] The SQLite store is clearly resettable or disposable for local iteration.
- [ ] The UI or implementation notes do not describe disposable SQLite rows as durable user memory.
- [ ] Reset behaviour is documented, including what happens to cached public demo queries.
- [ ] The first implementation may use a manual or deterministic Concierge result; it does not need a fully autonomous Codex worker.
- [ ] The result screen shows a short sourced answer first.
- [ ] `Why this?` reveals Sources/Source Trail material before any debug detail.
- [ ] The screen shows one Chairman Line as the next useful question.
- [ ] A coarse progress bar is visible for the current Thought Journey.
- [ ] Progress is stored per Journey or active Line, so interrupted topics can show different rough progress when resumed.
- [ ] A user can jump from one Journey to another without losing either Journey's query, answer, Line, or progress.
- [ ] The UI remains full-screen and phone-first.
- [ ] The existing Lens Compare path remains available for tester/debug use, but is not the primary surface.
- [ ] Backend smoke checks cover creating and reading one Concierge run.
- [ ] Android Chrome manual QA verifies query entry, result display, Sources reveal, progress display, and resuming a prior Journey.

## Previously blocked by

- `038-public-mvp-entry-copy-and-surprise-me.md`
- `039-voice-first-public-query-entry.md`

Already satisfied:

- `040-synthesized-answer-first-public-mvp.md`

Blockers cleared:

- `038-public-mvp-entry-copy-and-surprise-me.md`
- `039-voice-first-public-query-entry.md`

## Notes

This issue intentionally keeps the Concierge modest. The key product proof is not research depth. The proof is:

```text
Continuum can honour an interrupting thought, continue the current one, and show where each one is in the thinking journey.
```

## Implementation notes

First slice:

- Public answer page has a floating microphone button labelled `Talk to Chairman`.
- Browser speech recognition captures one reply to the active Chairman Line.
- Text fallback is available when speech is unsupported, blocked, or awkward.
- Backend stores each run in disposable local SQLite at `data/public-concierge-runs.sqlite`.
- Backend smoke creates and reads one run.
- The Chairman reply is deterministic for now; no autonomous research worker is implied.

Reset:

- Delete `data/public-concierge-runs.sqlite` and its SQLite sidecar files to reset local Concierge runs.
- Cached runs are disposable workbench rows only. They are not durable user memory.

Still open:

- Resume UI for older journeys after navigation/reload.
- Android Chrome QA for speech capture and resumed Journey display.
