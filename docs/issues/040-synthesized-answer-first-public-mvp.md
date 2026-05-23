# 040: Synthesized Answer First Public MVP

Status: planning

Type: HITL

## What to build

Change the public MVP exploration loop from card-first to answer-first.

Current UI proves that Lens/Thought Card streams can render. That is useful evidence, but it feels too document-like as the first thing a human sees. The next direction is:

```text
Surprise me or spoken query
-> synthesized answer
-> optional Why this? / Sources drill-down
-> one Line of Inquiry
```

The answer should be source-grounded and short enough to read on a phone. The cards remain important, but they become support rather than the main meal.

Product decision: synthesize the answer over canonical Thought Cards before Lens ordering. Lens outputs remain useful for evidence, debug, comparison, and later feedback, but the primary answer should not depend on choosing one hidden Lens.

Product decision: for the MVP, thumbs-up feedback scores the whole visible result: query, synthesized answer, and Line of Inquiry together. Later feedback can split answer quality, Lens/evidence quality, and question quality once the signal becomes useful enough to justify more UI.

Product decision: user-facing explanation language is `Why this?` and `Sources`, not `provenance`, `citation`, or `rationale`. The first drill-down should show source support: 2-4 supporting Thought Cards with source links. Lens variants belong behind debug/compare affordance.

## Acceptance criteria

- [ ] A public query renders a synthesized answer as the primary surface.
- [ ] The answer is built from source-backed Thought Cards, not free-floating generated text.
- [ ] The answer is synthesized over canonical Thought Cards before Lens ordering.
- [ ] The answer keeps source Thought Card ids or source paragraph refs behind it.
- [ ] A `Why this?` action lets the user dig into the answer's support.
- [ ] The `Why this?` panel shows `Sources` first.
- [ ] `Sources` shows 2-4 supporting Thought Cards with source links.
- [ ] Normal user-facing copy avoids `provenance`, `citation`, and `rationale`.
- [ ] The normal answer surface does not bias the user with Lens names before feedback.
- [ ] The system asks one Line of Inquiry after the answer.
- [ ] The Line of Inquiry is grounded in the same source support as the answer.
- [ ] The thumbs-up action records feedback against the whole visible result: query, answer, and Line of Inquiry.
- [ ] The old Lens carousel remains available as a debug/compare view until replaced.
- [ ] Mobile layout stays full-screen and readable.

## Open questions

None.

## Related

- Core needs answer and Line generation over Thought Cards before this becomes AFK-ready.
