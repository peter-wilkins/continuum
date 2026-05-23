# 040: Synthesized Answer First Public MVP

Status: ready

Type: AFK

## What to build

Change the public MVP exploration loop from card-first to answer-first.

Current UI proves that Lens/Thought Card streams can render. That is useful evidence, but it feels too document-like as the first thing a human sees. The next direction is:

```text
Surprise me or spoken query
-> synthesized answer
-> optional Why this? / Sources drill-down
-> visible Lens Compare for tester/model comparison
-> one Line of Inquiry
```

The answer should be source-grounded and short enough to read on a phone. The cards remain important, but they become support rather than the main meal.

Product decision: synthesize the answer over canonical Thought Cards before Lens ordering. Lens outputs remain useful for evidence, debug, comparison, and later feedback, but the primary answer should not depend on choosing one hidden Lens.

Product decision: for the MVP, thumbs-up feedback scores the whole visible result: query, synthesized answer, and Line of Inquiry together. Later feedback can split answer quality, Lens/evidence quality, and question quality once the signal becomes useful enough to justify more UI.

Product decision: user-facing explanation language is `Why this?` and `Sources`, not `provenance`, `citation`, or `rationale`. The first drill-down should show source support: 2-4 supporting Thought Cards with source links. Lens variants belong in a visible `Lens Compare` affordance, not as the first explanation section.

Product decision: keep Lens Compare visible in the MVP. The first users are us, and comparing Lenses is part of learning what works. This should not replace answer-first UX, but it should remain a clear, reachable surface rather than hidden diagnostics.

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
- [ ] A visible `Lens Compare` affordance remains available for MVP testers.
- [ ] `Lens Compare` lets testers compare Lens outputs without making the primary answer card-first again.
- [ ] The system asks one Line of Inquiry after the answer.
- [ ] The Line of Inquiry is grounded in the same source support as the answer.
- [ ] The thumbs-up action records feedback against the whole visible result: query, answer, and Line of Inquiry.
- [ ] Existing Lens carousel behaviour can be reused for `Lens Compare` if it keeps implementation small.
- [ ] Mobile layout stays full-screen and readable.

## Open questions

None.

## Related

- Core needs answer and Line generation over Thought Cards before this becomes AFK-ready.

## Implementation order

1. `/home/peter/continuum-core/docs/issues/088-generate-synthesized-answers-from-thought-cards.md`
2. `/home/peter/continuum-core/docs/issues/087-generate-lines-of-inquiry-from-thought-cards.md`
3. This app issue.

## Blocked by

- `/home/peter/continuum-core/docs/issues/088-generate-synthesized-answers-from-thought-cards.md`
- `/home/peter/continuum-core/docs/issues/087-generate-lines-of-inquiry-from-thought-cards.md`
