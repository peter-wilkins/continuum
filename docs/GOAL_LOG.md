# Goal Log

Append-only record of concrete goals, decisions, and daily targets.

New entries should be added below existing entries. Older entries should not be rewritten except to correct factual mistakes, and corrections should be noted explicitly.

---

## 2026-05-20

### End-of-day MVP goal

Build the first useful Continuum prototype around one narrow loop:

```text
ambient foreground listening
→ local silence filtering
→ speech chunk transcription
→ append-only transcript events
→ inspectable immutable log
```

The prototype should let the app listen while open, discard silence locally, transcribe spoken thoughts with a short delay, and preserve raw transcripts as immutable events.

The intended first use case is a person alone in a quiet place, speaking naturally while the app listens in the foreground.

### Public prototype index

Also build a small web entrypoint exposed through Tailscale Funnel for sharing early MVPs with friends and family.

The page should list available prototypes with:

- short description
- current status
- what to try
- link to open the prototype

The tone should be lightweight and public-facing, closer to a small lab/showcase than internal developer tooling.

### Day-one constraints

- Keep the product speech-first.
- After login, listening should auto-start when the app is focused/open; there should be no primary record button.
- End-of-day user experience: focus/open the app, speak, and the transcript appears on screen.
- Do not add a pause/resume control for the first version; closing or unfocusing the app is the control boundary.
- Listen only while the app is focused/visible; stop capture when hidden or blurred, then resume automatically when focused again.
- If logged out, show only the login screen. If logged in, show the reverse-chronological transcript log. Do not add auth/user chrome to the main capture view.
- Show newest transcript events at the top. Hide metadata by default; expose metadata/debug details only behind a URL flag such as `?debug=1`.
- Avoid chatbot-first UX.
- Avoid manual folders, tags, dashboards, and heavy settings.
- Preserve raw source material in an append-only event log.
- Build only the immutable log first; defer thread modelling, summaries, snapshots, embeddings, and retrieval design.
- Use a single `continuum.events` table for the first runtime schema.
- Store rich capture context in `metadata jsonb`, including location, device, browser, PWA/install state, audio/chunk diagnostics, permission state where available, and other mobile context that helps interpret the transcript later.
- Ask for location after login, but do not block capture if location permission is denied.
- Keep a small volatile recent-audio cache/ring buffer for retrying failed or bad transcriptions, but treat transcripts plus metadata as the durable append-only record.
- Audio cache may be discarded by the app/browser and should not be relied on as permanent source history.
- Use OpenAI for transcription.
- Use a separate Continuum OpenAI API key rather than reusing the JobDone key, so usage and costs can be tracked per project.
- Store the OpenAI API key backend-only in local environment configuration; never expose it to the frontend or store it in Supabase.
- Prefer a PWA-first implementation.
- Assume background or locked-phone recording is not reliable for the first PWA version.
- Use ambient foreground capture as the first practical version of constant search/listening.

### Working product line

> Continuum is for thinking out loud when you are alone in a quiet place. Speak naturally, and it quietly turns scattered thoughts into living context you can return to later.

### Runtime storage decision

Use Supabase for the day-one runtime store.

Continuum is a personal tool, not a user-growth experiment. Require login before meaningful behaviour:

- no capture, transcription, AI processing, or sync before login
- login should use Google OAuth, not magic links
- authenticated requests use Supabase JWTs
- prototype data lives in the shared Supabase project
- API-key-backed behaviour must stay behind authenticated access

Each MVP prototype should use its own PostgreSQL schema inside the shared Supabase database. Continuum should not create tables in `public`.

Keep implementation issues as local Markdown files for now rather than GitHub Issues.

Initial implementation issues:

- `docs/issues/001-supabase-schema.md`
- `docs/issues/002-google-oauth-gate.md`
- `docs/issues/003-auto-foreground-capture.md`
- `docs/issues/004-transcription-api.md`
- `docs/issues/005-immutable-event-log-ui.md`
- `docs/issues/006-prototype-index-funnel.md`

### Database workflow

Keep SQL in the repo as migration-style files, and apply it via a direct Postgres/Supabase connection where possible rather than manual dashboard copy-paste.

### MVP data-safety mode

Continuum is currently in MVP mode:

- clean code and clear schema design are more important than backwards compatibility
- prototype data is disposable
- destructive schema rewrites are acceptable when they improve clarity
- no data should be treated as safe or permanent yet

When the project exits MVP mode, the rule flips:

- backwards compatibility matters
- data preservation matters
- destructive rewrites require explicit migration plans
- raw source history must be protected as durable user memory
