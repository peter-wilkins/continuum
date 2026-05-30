# 042: Non-Document Thought Screen Prototypes

Status: done

## Type

Prototype.

## Question

What could a Continuum thought surface look like if it is not a document, article, feed, or stack of cards?

## Route

```text
/prototype/thought-screen
```

Variants are switched with `?variant=`:

- `journey`: Chairman Journey.
- `teacher`: Socratic Teacher.
- `learning`: Learning Journey.
- `constellation`: Thought Constellation.
- `compass`: Synthesis Compass.

## What Was Built

Five throwaway UI variants using the real public extended-thought data:

1. **Chairman Journey**: one active question, one current claim, progress/branch state, evidence chips, and two thumb actions.
2. **Socratic Teacher**: one teaching question, three tiny clue steps, understanding progress, and a smaller-question escape hatch.
3. **Learning Journey**: a very simple decision-tree learning path with one question, freeform answer input, and minimal visual noise.
4. **Thought Constellation**: central claim with surrounding thought/source nodes and relationship lines.
5. **Synthesis Compass**: central signal with synthesis moves orbiting it and one next pressure at the bottom.

## Prototype Rules

- This is not production UI.
- No new persistence.
- No real mutations.
- Delete or absorb once a direction wins.

## Initial Bet

Chairman Journey is the strongest candidate because it best expresses Continuum's differentiator: guided continuation rather than document reading.
