# Infrastructure Notes

## Emerging insight

GitHub and Git commits were useful for early continuity experiments, but they introduce significant cognitive friction.

Git is optimised for:

- files
- commits
- repositories
- explicit versioning
- software engineering workflows

Human cognition is:

- streaming
- associative
- overlapping
- ongoing
- non-atomic

Continuum should optimise for persistent cognition rather than developer workflows.

---

# Desired infrastructure qualities

The system should provide:

- append-only durability
- automatic backup
- instant replication
- multi-device continuity
- low operational overhead
- private/local-first operation
- AI/agent compatibility
- minimal deployment friction

The user should not need to think about:

- commits
- exports
- sync
- backups
- deployments
- version management

The system should simply preserve cognition continuously.

---

# Architectural direction

Preferred long-term model:

```text
append-only event log
→ AI interpretation layers
→ contextual retrieval
→ automatic replication
→ resilient backups
```

Not:

```text
files
→ commits
→ repositories
→ manual version control
```

---

# Suggested stack direction

## Local storage

SQLite.

Reasons:

- simple
- reliable
- local-first
- fast
- append-friendly
- easy AI integration
- excellent tooling

---

## Replication and backup

Potential tools:

- Litestream
- LiteFS
- Syncthing
- Tailscale

Goal:

> continuous resilient copies with minimal operational overhead.

---

# Litestream direction

Litestream is particularly aligned with the Continuum philosophy.

Potential architecture:

```text
local SQLite database
→ continuous replication
→ cloud object storage backup
```

Benefits:

- simple
- resilient
- low-cost
- automatic
- local-first
- no commit ceremony

---

# Tailscale direction

Tailscale is useful for:

- fast MVP deployment
- private networking
- direct device access
- low-friction testing
- avoiding premature cloud infrastructure

Potential architecture:

```text
phone
↔ tailscale
↔ local server
↔ append-only event store
```

---

# Important philosophical principle

Continuum should aim for:

> invisible persistence.

The system should continuously preserve and replicate cognition without requiring explicit management from the user.
