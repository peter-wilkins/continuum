# MVP Prototype Rules

This document defines the default rules, constraints, and engineering assumptions for rapid MVP prototypes.

The goal is:

> maximum learning velocity with minimum operational overhead.

These rules should be treated as defaults unless there is a strong reason to break them.

---

# Core philosophy

Optimise for:

- feedback speed
- iteration speed
- cognitive simplicity
- low maintenance
- rapid deployment
- low cost
- preserving momentum

Avoid:

- premature scaling
- over-engineering
- enterprise architecture
- unnecessary abstractions
- heavy DevOps
- complex deployment pipelines

The objective of an MVP is:

> learning, not completeness.

---

# Infrastructure defaults

## Supabase strategy

Use a single shared Supabase project for multiple prototypes whenever possible.

Separate prototypes using PostgreSQL schemas.

Example:

```sql
create schema prototype_continuum;
create schema prototype_voice;
create schema prototype_search;
```

Benefits:

- faster setup
- reduced operational overhead
- shared authentication
- easier experimentation
- lower costs

Promote a prototype into its own Supabase project only when:

- stability becomes important
- scaling concerns emerge
- multiple collaborators require isolation
- deployment complexity increases

---

## Deployment strategy

Avoid formal deployment infrastructure early.

Default approach:

- run locally
- expose via Tailscale Funnel
- test immediately on real devices

Benefits:

- near-zero deployment friction
- fast mobile testing
- rapid iteration loops
- lower infrastructure complexity
- easier debugging

Formal cloud deployment should happen only after:

- product direction stabilises
- real usage patterns emerge
- the MVP proves valuable

---

# Product development rules

## Build the core loop first

Always prioritise:

```text
capture
→ processing
→ retrieval
→ feedback
```

Do not spend time on:

- settings pages
- admin panels
- onboarding flows
- permissions systems
- visual polish
- advanced customization

until the core loop is genuinely useful.

---

## Prefer conversational interaction

When possible:

- remove buttons
- remove forms
- remove explicit configuration
- reduce navigation

The system should infer intent wherever practical.

---

## Preserve source material

All user input should be stored in an append-only source log.

AI-generated layers should sit on top of immutable source history.

Never silently rewrite raw user input.

---

## Retrieval is more important than storage

The success metric is not:

- how much information is captured

The success metric is:

> how effectively the system restores useful context at the moment it is needed.

---

# Technical defaults

## TypeScript everywhere

Default stack:

- TypeScript frontend
- TypeScript backend
- shared types where practical

Reduce context switching between languages.

---

## Mobile and real-device testing early

Do not rely heavily on desktop browser simulation.

Test on:

- actual phones
- real networks
- poor conditions
- real interruptions
- lock/unlock cycles
- multitasking scenarios

---

## PWA-first approach

Default assumption:

- Progressive Web App first
- native app only if clearly necessary

Reasons:

- faster iteration
- easier distribution
- lower maintenance
- shared codebase
- instant updates

---

## Local-first thinking

Where practical:

- cache aggressively
- support offline capture
- queue sync operations
- avoid blocking user actions on network calls

The UI should feel responsive even under poor connectivity.

---

# AI rules

## User-supplied API keys by default

Early prototypes should prefer:

- BYOK (bring your own key)

Benefits:

- dramatically lower platform costs
- easier experimentation
- reduced abuse risk
- faster iteration
- power-user friendly

---

## AI should reduce maintenance burden

The AI should:

- organise
- summarise
- connect
- surface
- retrieve

The user should not become a database administrator.

---

## Minimise prompting complexity

Prefer:

- simple system prompts
- clear architectural rules
- structured context pipelines

Avoid:

- giant prompts
- brittle orchestration
- excessive agent complexity

Simple systems are easier to debug and evolve.

---

# Promotion criteria

An MVP graduates from prototype status when:

- users repeatedly return to it
- the core loop provides obvious value
- the workflow becomes habitual
- reliability becomes important
- collaboration becomes necessary
- scaling pain becomes real

Only then should the project invest heavily in:

- infrastructure
- security hardening
- deployment systems
- analytics
- optimization
- native apps
- enterprise features

---

# Guiding principle

The product should feel:

- calm
- fast
- lightweight
- trustworthy
- cognitively effortless

The system should adapt to the user faster than the user adapts to the system.
