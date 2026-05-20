# Continuum SPEC

## Vision

Continuum is a mobile-first AI workspace that helps users capture ideas quickly and continue where they left off.

The product turns raw captures into living project documents. A user can add voice notes, text, images, links, contacts, and other snippets without needing to organise them manually. The AI then curates summaries, decisions, next actions, open questions, and useful context.

## Core idea

People often do not need a full history. They need the right context at the moment they are about to resume work, reply to someone, make a decision, or continue a project.

Continuum is designed to provide that context with minimal friction.

## MVP goals

1. Fast mobile capture.
2. Reliable cross-device sync.
3. One living document per project or topic.
4. Append-only raw capture history.
5. Clearly separated AI-maintained sections.
6. Semantic search and retrieval.
7. User-supplied AI API key support.

## Suggested stack

- React
- TypeScript
- Progressive Web App
- Supabase or Firebase
- OpenAI-compatible API support
- IndexedDB for local capture queue
- Optional Web Share Target support

## Document model

Each project document should contain:

### Raw Capture Feed

An append-only record of user input. The AI should not silently rewrite this source material.

### AI-Maintained Sections

- Current Summary
- Key Decisions
- Next Actions
- Open Questions
- Timeline
- Related People
- Important Context

## Product principles

- Capture should be faster than organising.
- AI should reduce maintenance burden.
- Source material should remain trustworthy.
- Retrieval is more important than storage.
- The mobile experience should be simple and one-handed.

## Future ideas

- Google Docs integration.
- Offline-first storage.
- Local image compression.
- Voice transcription.
- Web Share Target support for images, links, text, and contacts.
- Project-specific AI agents.
- Shared project documents.

## Positioning

Continuum is not a traditional notes app, task manager, or document editor.

Continuum is an evolving project memory system that helps users instantly regain context and continue work.
