# 016 · Model durable people, roles, affiliations, and participation history

**Status** Approved / In Progress  
**Owner** Dennis Commander  
**Worker** Chat / engineering review  
**Review** Dennis. Consult Jared on downstream UI and product implications.  
**Priority** High

## Objective

Refine the canonical DebateOS warehouse model so one durable human identity can participate in debate over time in different roles, at different institutions, and with different partners without creating duplicate people or overwriting history.

This task is architecture-only. It does not authorize a schema migration, backfill, authenticated data collection, or protected-data ingestion.

## Design requirements

### 1. Person is the durable human identity

- A person is not inherently a debater, judge, coach, student, or member of one school.
- Provider-backed person identities should resolve to one durable DebateOS person only when supported by explicit source evidence.
- Do not create a new person merely because the human changes role, institution, partner, season, or tournament.
- Keep provider/source identities and DebateOS internal identity distinct.

### 2. Roles are historical and contextual

A person may act as one or more roles over time, including:

- debater
- judge
- coach
- administrator or other future roles when supported

A person may hold multiple roles simultaneously. Role must not be a single mutable column on `person`.

Define an evidence-backed role observation/membership model with appropriate scope and time semantics. Unknown start/end dates must be representable without inventing precision.

### 3. Institutional affiliation is historical

A person may:

- debate for one institution and later transfer to another;
- attend graduate school and debate or coach at another institution;
- judge independently;
- coach at an institution different from the one where they debated.

Institution or school must not be a permanent attribute of Person.

Distinguish:

- tournament-scoped school records;
- durable chapter/institution identity where explicitly supported;
- person-to-institution affiliation observations over time;
- role within that affiliation where evidenced.

Do not infer continuous affiliation merely from one tournament appearance.

### 4. Debater identity and entry membership

The current physical model contains tournament-scoped student references and entry roster membership concepts, while durable debater-to-person resolution remains deferred.

Define the destination model for:

- explicit student/debater reference -> durable person evidence;
- entry roster membership;
- a person appearing in many entries;
- an entry containing multiple persons;
- partner changes across tournaments and seasons.

A person must be able to debate with Person B in one entry and Person C in another without changing the person's identity.

### 5. Team / partnership semantics

Do not model a debate partnership as a permanent attribute of either person.

The source-of-truth competition fact is entry membership. If DebateOS later introduces a durable partnership/team episode, it must be:

- derived from or supported by evidenced memberships;
- time/scoped;
- many-to-many across a person's history;
- replaceable by stronger evidence;
- separate from tournament entry identity.

Entry codes or names alone must not establish durable team identity.

### 6. Judge identity remains compatible

Preserve the existing distinction among:

- durable Person;
- tournament-scoped Judge;
- evidence-backed Judge -> Person link;
- panel judge assignment.

The same Person may have historical debater memberships and later judge records.

### 7. Evidence, uncertainty, and temporal semantics

For every role, affiliation, student-person link, and membership:

- preserve provenance;
- distinguish observed dates from inferred intervals;
- permit open-ended/unknown ranges;
- retain conflicting evidence rather than silently overwriting;
- avoid treating absence of later evidence as proof an affiliation or role ended;
- support as-of analysis.

## Required scenarios

The architecture must explicitly handle these examples without duplicate people:

1. A person debates for Institution A, transfers to Institution B, then becomes a judge.
2. A person debates with Partner A, later Partner B, and later reunites with Partner A.
3. A person is simultaneously a graduate student/debater and an active judge in different contexts.
4. A person changes coaching institutions while remaining the same human identity.
5. A tournament student reference cannot yet be linked to a durable person; it remains unresolved without forcing a match.

## Deliverable

Create an ADR-style architecture addendum that defines:

- entity grains and logical keys;
- cardinalities;
- temporal and evidence rules;
- how existing `persons`, `judges`, `students`, `entries`, schools and chapters fit;
- what new logical relationships are needed;
- what remains intentionally unresolved;
- staged physical-schema implementation recommendations.

## Acceptance criteria

- Person has no permanent role, team, partner, or institution attribute.
- Role changes do not create new people.
- School transfers do not create new people.
- Partner changes do not create new people.
- Existing judge-person modeling remains valid.
- Student/debater-to-person crosswalk requires explicit evidence.
- Entry membership is the competition-level fact for who debated together.
- Institutional affiliations are historical observations, not timeless facts.
- The design supports unknown dates and conflicting evidence.
- No physical schema or migration is changed in this task.
- No protected or private source data is added to the public repository.

## Follow-on work

After Dennis approves the architecture:

1. create a separate physical-schema work order for the new relationships;
2. migrate/backfill only evidence-backed public relationships first;
3. then proceed with the public judge-profile usability proof using the durable person model;
4. keep authenticated Tabroom integration on its separate private/local track.
