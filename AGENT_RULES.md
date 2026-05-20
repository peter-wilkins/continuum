# Agent Rules

This document defines behavioural rules for AI agents, coding agents, and contributors working on Continuum.

The purpose of these rules is to preserve the philosophical integrity of the product.

---

# Core responsibility

Your responsibility is not only to implement requested features.

Your responsibility is also to:

- protect the product philosophy
- preserve conceptual clarity
- identify architectural drift
- push back against decisions that weaken the core idea

If a proposed feature or direction conflicts with the philosophy of Continuum, you should explicitly explain the conflict.

---

# Core product philosophy

Continuum exists to:

> reduce the friction between human thought and digital systems.

The product should help users:

- continue where they left off
- regain context rapidly
- externalise cognition
- maintain continuity across time

The system should adapt to the user faster than the user adapts to the system.

---

# Danger patterns

You should actively push back against proposals that move the product toward:

## Generic chatbot UX

Danger signs:

- linear chat interfaces dominating the product
- prompt-response interaction as the primary paradigm
- excessive focus on conversation instead of continuity

Continuum is situational, not merely conversational.

---

## Productivity software drift

Danger signs:

- kanban boards
- dashboards
- heavy settings pages
- enterprise admin systems
- folder-centric UX
- database-management UX

The product should feel lightweight, ambient, and cognitively effortless.

---

## User-maintained structure

Danger signs:

- manual tagging requirements
- complex folder systems
- explicit categorisation burden
- extensive configuration

The AI should absorb organisational complexity wherever possible.

---

## Loss of contextual continuity

Danger signs:

- session-based interactions
- isolated conversations
- weak historical resurfacing
- lack of persistent threads

The system should continuously maintain evolving context.

---

## Loss of trustworthiness

Danger signs:

- destructive rewriting of source material
- opaque memory mutation
- disappearing historical context
- hidden summarisation layers

The append-only source log is foundational.

The AI interprets memory.
It does not replace memory.

---

# Preferred design qualities

Prefer:

- calm interfaces
- progressive disclosure
- contextual resurfacing
- anticipatory retrieval
- short summaries
- recognition-oriented UX
- conversational shorthand
- low-friction interaction
- continuity of thought

Avoid:

- visual clutter
- explicit system management
- excessive navigation
- feature bloat
- productivity theatre

---

# Engineering philosophy

Optimise for:

- iteration speed
- simplicity
- maintainability
- clear architecture
- append-only systems
- composable AI layers

Avoid:

- premature scaling
- excessive abstractions
- brittle orchestration
- over-engineered agent systems

---

# Final principle

When evaluating product decisions, ask:

> Does this reduce or increase the cognitive distance between the user's mind and useful context?

If it increases that distance, it is probably the wrong direction.
