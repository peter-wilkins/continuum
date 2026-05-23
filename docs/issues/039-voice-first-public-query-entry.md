# 039: Voice-First Public Query Entry

Status: blocked

Type: AFK

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

Privacy/network caveat: browser speech recognition may be implemented by the browser through a vendor or server-based recognition service. Continuum should not claim that browser recognition is local or offline. This slice only guarantees that Continuum itself does not store raw audio or route raw audio through the Continuum backend.

## Acceptance criteria

- [ ] The public entry surface presents speaking as the primary custom-query path.
- [ ] The voice prompt says `Ask out loud about tools for thought`.
- [ ] A user can submit a recognized spoken query into the public Continuum flow.
- [ ] A text fallback exists for unsupported browsers, denied microphone permission, or failed recognition.
- [ ] Unsupported speech does not break `Surprise me`.
- [ ] Off-topic spoken queries show the MVP-boundary explanation.
- [ ] The recognized query is visible after navigation so the user knows what they asked.
- [ ] No raw audio is stored in this slice unless a later issue explicitly adds capture/provenance.
- [ ] UI copy does not claim browser speech recognition is local, private, or offline.
- [ ] The implementation notes distinguish "Continuum does not store raw audio" from "the browser may use a vendor recognition service".
- [ ] Mobile Chrome on Android is manually smoke-tested.

## Product decisions

- Use browser speech recognition first for the public phone MVP.
- Do not route raw audio through Continuum in this slice.
- Do not store raw audio in this slice.
- Do not imply browser speech recognition is local-first; it is a convenience path before Continuum Audio exists.
- If recognition fails or is unavailable, keep the spoken-query intent alive and fall back to text.
- A future native/audio-core path can replace browser speech once the Concierge loop proves useful.

## Blocked by

- `038-public-mvp-entry-copy-and-surprise-me.md`

## References

- Web Speech API specification: `https://webaudio.github.io/web-speech-api/`
- MDN `SpeechRecognition`: `https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition`
