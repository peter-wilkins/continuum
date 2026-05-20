# Continuum SPEC

## Vision

Continuum is a multiple-device AI workspace that helps users continue where they left off.

The product is designed around a simple idea:

> People rarely need full history. They need the right context immediately before action.

Continuum turns spoken thoughts into living project documents.

Each document represents:

- a project
- a topic
- an ongoing concern
- a thread in someone's brain

The AI continuously curates these documents over time.

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

---

## MVP goals

1. Speech-first capture.
2. Reliable sync across devices.
3. One evolving document per project or mental thread.
4. AI-maintained contextual summaries.
5. Extremely fast context recovery.
6. User-supplied AI API key support.

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
