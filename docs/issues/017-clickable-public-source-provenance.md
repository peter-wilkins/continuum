# Issue 017: Clickable Public Source Provenance

Status: done

## Goal

Make the public Continuum page show source provenance as a path back to the public source record.

## Scope

- Add a nullable source URL to the app-facing public event contract.
- Derive the URL from canonical source fields rather than duplicating another source-of-truth field.
- Render source names as links when the URL is known.

## Acceptance Criteria

- [x] Wikidata public events link to their Wikidata entity page.
- [x] Public archive document events link to their source document URL.
- [x] Events without a known URL still render source name and license without breaking the page.
