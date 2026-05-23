# 040: Synthesized Answer First Public MVP

Status: planning

Type: HITL

## What to build

Change the public MVP exploration loop from card-first to answer-first.

Current UI proves that Lens/Thought Card streams can render. That is useful evidence, but it feels too document-like as the first thing a human sees. The next direction is:

```text
Surprise me or spoken query
-> synthesized answer
-> optional evidence / Lens / Thought Card drill-down
-> one Line of Inquiry
```

The answer should be source-grounded and short enough to read on a phone. The cards remain important, but they become evidence rather than the main meal.

Product decision: synthesize the answer over canonical Thought Cards before Lens ordering. Lens outputs remain useful for evidence, debug, comparison, and later feedback, but the primary answer should not depend on choosing one hidden Lens.

## Acceptance criteria

- [ ] A public query renders a synthesized answer as the primary surface.
- [ ] The answer is built from source-backed Thought Cards, not free-floating generated text.
- [ ] The answer is synthesized over canonical Thought Cards before Lens ordering.
- [ ] The answer keeps source Thought Card ids or source paragraph refs behind it.
- [ ] The user can dig into the supporting Lens/Thought Cards from the answer.
- [ ] The normal answer surface does not bias the user with Lens names before feedback.
- [ ] The system asks one Line of Inquiry after the answer.
- [ ] The Line of Inquiry is grounded in the same evidence as the answer.
- [ ] The old Lens carousel remains available as a debug/evidence view until replaced.
- [ ] Mobile layout stays full-screen and readable.

## Open questions

- Does user feedback choose the best answer, the best Lens behind the answer, or the best Line of Inquiry?
- Should evidence drill-down show anonymized Lens variants first, or source/provenance first?

## Related

- Core needs answer and Line generation over Thought Cards before this becomes AFK-ready.
