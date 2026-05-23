# 040: Synthesized Answer First Public MVP

Status: done

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

Product decision: while the first users are testers comparing Lenses, Lens-specific `+1` remains on Lens Compare pages. Whole-result feedback can be revisited after the answer-first surface stabilizes.

## Acceptance criteria

- [x] A public query renders a synthesized answer as the primary surface.
- [x] The answer is built from source-backed Thought Cards, not free-floating generated text.
- [x] The answer is synthesized over canonical Thought Cards before Lens ordering.
- [x] The answer keeps source Thought Card ids or source paragraph refs behind it.
- [x] A `Why this?` action lets the user dig into the answer's support.
- [x] The `Why this?` panel shows `Sources` first.
- [x] `Sources` shows 2-4 supporting Thought Cards with source links.
- [x] Normal user-facing copy avoids `provenance`, `citation`, and `rationale`.
- [x] The normal answer surface does not bias the user with Lens names before feedback.
- [x] A visible `Lens Compare` affordance remains available for MVP testers.
- [x] `Lens Compare` lets testers compare Lens outputs without making the primary answer card-first again.
- [x] The system asks one Line of Inquiry after the answer.
- [x] The Line of Inquiry is grounded in the same source support as the answer.
- [x] Lens-specific `+1` remains available on Lens Compare pages for tester feedback.
- [x] Existing Lens carousel behaviour can be reused for `Lens Compare` if it keeps implementation small.
- [x] Mobile layout stays full-screen and readable.

## Implementation

Added answer-first public Continuum response fields and UI:

- synthesized answer
- `Why this?` / `Sources`
- recommended Line of Inquiry
- visible Lens Compare using the existing Lens carousel and Lens-specific `+1`

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
