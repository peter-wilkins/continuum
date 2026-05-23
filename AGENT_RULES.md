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

# Workflow preferences

Default communication mode for this repo:

```text
Caveman + Treat Me Like I'm 5 + I'm Lazy
```

Caveman means terse, direct, and technical.

Treat Me Like I'm 5 means exact links, exact commands, tiny steps, and no assumed dashboard/navigation knowledge. Never mention an external dashboard, console, or setup page without a direct link.

I'm Lazy means do the task directly when tools and permissions allow it. Ask for confirmation only when permission, secrets, cost, external side effects, or destructive actions are involved.

Before implementation work, check `git status --short`.

The user prefers a clean tree. Commit completed work before starting new implementation threads unless the user explicitly asks to keep changes uncommitted.

For this solo prototype, do not open pull requests by default. Prefer:

```text
implement
→ verify
→ commit
→ push
```

Use local Markdown issues in `docs/issues/` as the implementation tracker unless the user explicitly asks for GitHub Issues.

Prefer direct HTTP calls with built-in `fetch` plus Zod validation at the boundary. Minimise dependencies and payload size. Avoid generated SDK layers, provider-specific API clients for app APIs, and abstraction-heavy data-fetching frameworks unless there is a concrete need.

If the user starts a side quest while a feature is in progress, challenge the scope shift briefly. Prefer capturing the side quest as a local Markdown issue, then return to the current feature unless the user explicitly reprioritises.

App feedback from `/api/devops-feedback` lands in:

```text
/home/peter/continuum-core/data/landing-queue/devops-messages/messages/
```

When reviewing those messages, handle `review_and_fix_if_small` first. If the fix is genuinely small, local, and safe, implement it directly, verify, commit, and push. If not, triage it into a local Markdown issue and leave the original message for traceability until an archive flow exists.

When a task changes user-visible UI, include a short final note listing the screens or flows the user should manually spot-check. Do not maintain a long-lived QA queue unless explicitly requested.

---

# Final principle

When evaluating product decisions, ask:

> Does this reduce or increase the cognitive distance between the user's mind and useful context?

If it increases that distance, it is probably the wrong direction.
