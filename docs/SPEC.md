# Continuum SPEC

## Vision

Continuum is a multiple-device AI workspace that helps users continue where thought left off.

The product is designed around a simple idea:

> People rarely need full history. They need the right context immediately before action.

Continuum turns captured or imported thought into living Continuation surfaces.

Each document represents:

- a project
- a topic
- an ongoing concern
- a thread in someone's brain

The AI continuously curates these documents over time.

---

## High-level concept

The goal of Continuum is to reduce the friction between the human brain and the system.

Most software forces people to:

- translate thoughts into interfaces
- navigate systems
- organise information manually
- remember where things were stored
- repeatedly reconstruct context

Continuum should feel much closer to direct thought continuation.

The interaction model is:

> the user speaks naturally, and the system immediately reshapes itself around the likely context of that thought.

The screen should not behave like a static document editor.

It should behave more like:

- a living memory surface
- an evolving contextual field
- an AI-curated continuation of the user's train of thought

When the user says something, the system should proactively surface:

- what they were probably thinking about
- related previous thoughts
- unresolved concerns
- likely next questions
- important historical context
- associated projects or people

The experience should feel like:

> the system is already moving toward the user's next thought.

---

## Core idea

The user interacts primarily through speech.

The goal is extremely low-friction capture.

The user should be able to:

- speak naturally
- dump thoughts quickly
- continue working

without:

- organising information
- naming folders
- structuring documents
- maintaining systems

The AI handles curation and structure.

Over time, the AI and user may develop shorthand language patterns.

Examples:

- "Continue Jenkins"
- "The supplier thing"
- "That bathroom issue"
- "What was I worried about yesterday?"

The system should gradually learn:

- recurring concepts
- relationships between projects
- emotional patterns
- user shorthand
- operational context

---

## Foundational architecture

The foundation of Continuum should be extremely simple and trustworthy.

At the core of the system is:

> an append-only source log.

Every spoken capture is stored permanently as a chronological event.

Examples:

- voice transcripts
- timestamps
- AI summaries
- thread associations
- metadata

The source log should never be destructively rewritten.

This creates:

- trustworthiness
- recoverability
- auditability
- simple mental models
- resilient AI curation

The AI layer should sit on top of this append-only history.

The AI can:

- summarise
- annotate
- connect ideas
- surface patterns
- generate context
- reorganise views

But the underlying event stream remains intact.

Conceptually:

```text
append-only memory stream
→ AI interpretation layers
→ contextual views
→ conversational retrieval
```

This should make the product feel stable, trustworthy, and difficult to corrupt.

---

## MVP goals

The MVP is no longer primarily Peter's private personal Continuum.

The MVP should be a public, bootstrapped Continuum about extended thought. Users should be able to explore a Continuum seeded from public data, such as Ada Lovelace and computing, then give feedback that teaches the product what is useful.

Private personal capture and imports remain part of the long-term product, but public identity/topic Continuums are the safer and faster MVP learning loop.

1. Public identity/topic import.
2. Inspectable Continuation surfaces over imported public thought.
3. Lightweight user feedback while people explore.
4. Immutable append-only source history.
5. Clear provenance and source links.
6. Fast iteration without private-data compliance blocking every demo.
7. Speech-first personal capture as a later reinforcing path, not the MVP blocker.

---

## Document structure

Each project document should feel like:

> resuming an ongoing conversation with yourself.

The document should contain layered context.

### 1. Instant Reminder

At the very top:

A very short summary designed to instantly reorient the user.

Examples:

- "Bathroom quote waiting for revised pricing. Customer worried about timing."
- "Need to finish API sync before mobile testing."
- "Ongoing concern about supplier reliability."

The purpose is rapid mental reacquisition.

---

### 2. Current Context

Below the instant reminder:

The AI's best guess about the current situation.

Examples:

- what matters right now
- latest developments
- unresolved issues
- current priorities
- likely next actions
- emotional or operational context

This section should feel like:

> "Here's where things currently stand."

---

### 3. Deeper Context

Scrolling further down reveals:

- longer summaries
- timelines
- previous discussions
- supporting details
- historical captures
- AI annotations
- relevant media or references added by the AI

The depth should progressively increase as the user scrolls.

Browsing should stimulate memory and new thoughts.

The visual experience should optimise for:

- recognition
- resurfacing
- rediscovery
- continuation

rather than only direct search.

---

## AI behaviour principles

### Preserve source material

Raw spoken captures should remain preserved.

The AI should curate around the source material rather than silently rewriting it.

---

### Reduce maintenance burden

The system should minimise:

- tagging
- folder management
- manual organisation
- setup complexity

The product should feel lightweight and calming.

---

### Retrieval over storage

The most important feature is not storage.

It is helping the user rapidly regain context before action.

Examples:

- before speaking to someone
- before resuming work
- before replying
- before entering a meeting
- before continuing a project

---

## Suggested MVP stack

### Frontend

- React
- TypeScript
- Progressive Web App

### Backend

- Supabase or Firebase
- realtime sync
- authentication
- storage

### AI

- user-supplied API keys
- OpenAI-compatible APIs
- optional support for multiple providers later

---

## Future ideas

- Google Docs integration
- semantic search
- offline-first storage
- local transcription
- AI-generated relationship mapping
- collaborative shared project spaces
- AI-generated reminders and resurfacing

---

## Positioning

Continuum is not a traditional notes app, task manager, or document editor.

Continuum is:

> an evolving operational memory system that helps users instantly regain context and continue where they left off.
