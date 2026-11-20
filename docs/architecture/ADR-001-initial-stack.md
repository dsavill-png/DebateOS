# ADR-001 · Initial application stack

**Status:** Accepted  
**Decision date:** 2026-11-20  
**Decision owners:** Dennis, Jared, and Chat leadership model

## Decision

DebateOS will begin with:

- **TypeScript** as the primary application language.
- **Next.js** for the web application and application/API layer.
- **PostgreSQL** as the durable application database.
- **Python** may be introduced later for specialized data, parsing, analytics, or AI workloads when there is a concrete need. Python is not the default application runtime for the initial implementation.

## Rationale

This gives DebateOS one primary language across most of the product, a strong web/UI ecosystem, straightforward server/API capabilities, and a relational database suited to tournament, debate, judge, argument, evidence, provenance, and revision relationships.

The decision also preserves a clean escape hatch for Python-heavy jobs without splitting the core application across languages prematurely.

## Boundaries

This ADR does **not** select:

- hosting/cloud provider,
- ORM/query builder,
- package manager,
- authentication provider,
- queueing system,
- vector database,
- deployment topology.

Those choices remain open until a task actually requires them or leadership approves them.

## Consequences

- New core application code should default to TypeScript.
- UI and server/API work should fit the Next.js application unless an approved work order establishes a separate service.
- Persistent normalized application data should target PostgreSQL.
- Codex must not silently introduce a second primary application framework or database.
