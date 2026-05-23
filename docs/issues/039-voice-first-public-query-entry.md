# 039: Voice-First Public Query Entry

Status: planning

Type: HITL

## What to build

Let public MVP users speak their own query instead of making typing the default.

The MVP is constrained to one loaded topic: extended thought and brain augmentation. Speaking a query should feel like asking the Continuum where to start, not like filling in a search form.

Recommended MVP shape:

- Primary control: hold/tap to speak.
- Prompt: `Ask out loud about tools for thought`.
- Text entry: fallback only, shown when speech is unavailable, denied, or fails.
- Result: the recognized query flows into the same bounded public Continuum path as `Surprise me`.
- Boundary: off-topic speech gets the same MVP-boundary explanation as text.

Do not make this depend on user login. Asking a public query should remain part of the public exploration loop.

## Acceptance criteria

- [ ] The public entry surface presents speaking as the primary custom-query path.
- [ ] The voice prompt says `Ask out loud about tools for thought`.
- [ ] A user can submit a recognized spoken query into the public Continuum flow.
- [ ] A text fallback exists for unsupported browsers, denied microphone permission, or failed recognition.
- [ ] Unsupported speech does not break `Surprise me`.
- [ ] Off-topic spoken queries show the MVP-boundary explanation.
- [ ] The recognized query is visible after navigation so the user knows what they asked.
- [ ] No raw audio is stored in this slice unless a later issue explicitly adds capture/provenance.
- [ ] Mobile Chrome on Android is manually smoke-tested.

## Open questions

- Should the MVP use browser speech recognition first, or route audio through the Continuum transcription path?
- Should failed recognition ask the user to try again, or fall straight back to text?

## Blocked by

Needs one implementation choice before it is AFK-ready.

