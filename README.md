# Continuum

> The system should adapt to the user faster than the user adapts to the system.

Continuum is an AI system focused on continuity of thought.

The goal is to reduce the friction between the human brain and digital systems.

Rather than forcing users to:

- organise information
- manage folders
- remember where thoughts were stored
- reconstruct context repeatedly

Continuum attempts to continuously maintain and restore useful context over time.

---

# Core idea

The user interacts primarily through speech.

The system continuously turns spoken thoughts into evolving contextual threads.

Each thread represents something like:

- a project
- an ongoing concern
- a relationship
- an unresolved issue
- a recurring topic
- a thread in someone's brain

The system should feel less like software and more like:

- a living memory surface
- contextual scaffolding
- externalised cognition
- an operational memory layer

---

# Key distinction

Continuum is not trying to become:

- a chatbot
- a note-taking app
- a productivity dashboard
- a knowledge-base UI

The system is designed around a different goal:

> helping users rapidly re-enter the relevant cognitive state.

Chat systems preserve conversations.

Continuum aims to preserve continuity.

---

# The problem

Current conversational AI systems create a common frustration:

> “I know I already thought about this, but I don't know where it lives anymore.”

This leads to:

- scrolling through old chats
- duplicate conversations
- fragmented thinking
- repeated context reconstruction
- anxiety about losing important ideas

Continuum exists partly to reduce this anxiety.

---

# Architectural philosophy

At the foundation of the system is:

> an immutable append-only source log.

Every spoken capture becomes a chronological event.

The AI can:

- summarise
- annotate
- connect
- reinterpret
- surface
- organise

But the original source history remains recoverable.

This creates:

- trust
- continuity
- recoverability
- stable long-term memory

Core principle:

> The unit of storage is events.
> The unit of retrieval is context.

---

# Interaction philosophy

The system should minimise explicit interface management.

The ideal interaction is:

```text
thought
→ speech
→ contextual adaptation
```

not:

```text
thought
→ folders
→ forms
→ tagging
→ searching
→ reconstruction
```

The AI should proactively surface:

- likely related thoughts
- unresolved concerns
- relevant past context
- emotional continuity
- likely next actions

The experience should feel like:

> the system is already moving toward the user's next thought.

---

# Retrieval philosophy

Continuum optimises for:

- momentum restoration
- contextual resurfacing
- mental reacquisition
- recognition over recall
- continuity of thought

Success metric:

> How quickly can the user mentally re-enter the relevant context?

---

# MVP constraints

Current constraints and principles:

- speech-first interaction
- PWA-first architecture
- multiple-device sync
- append-only memory model
- user-supplied AI API keys
- lightweight infrastructure
- rapid iteration loops
- Tailscale Funnel for fast real-device testing
- shared Supabase project with schema separation for prototypes

---

# Repository docs

- `docs/SPEC.md` — evolving product specification
- `docs/PHILOSOPHY.md` — philosophical direction
- `docs/MVP_RULES.md` — MVP engineering rules
- `docs/GOAL_LOG.md` — append-only goals, decisions, and daily targets
- `docs/issues/` — local Markdown implementation issues
- `docs/CONTINUITY_NOTES.md` — continuity and trust concepts
- `AGENT_RULES.md` — behavioural guardrails for coding agents
