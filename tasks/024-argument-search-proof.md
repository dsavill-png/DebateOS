# 024 · Argument search contract and ranking proof

**Status** Implemented, pending draft PR review

**Owner** Jared Commander

**Worker** Codex

**Authorization** Jared approved the search-only proof on November 25, 2026.

## Objective

Prove that a search for “No US-China War” prioritizes evidence about whether direct war is unlikely. A search for likelihood or consequences should surface the corresponding evidence. Use labeled synthetic records for the public proof.

## Scope and contract

- Run the TypeScript ranking module and fixture tests within the existing DebateOS repository.
- Accept the query, search intent, optional clarification choice and result limit. Return the interpretation and typed card, argument or document results. The proof recognizes the US–China war subject and its four evidence facets. Other queries use lexical matching.
- Pass current source and registry grants in from the trusted caller. Filter eligible sources before ranking, duplicate grouping and result limits. This module depends on server-verified grants and revision inputs.
- Rank compatible card claims first, then unlabeled candidates and document metadata. Label opposing claims and results that answer a different question. Preserve conditional claims in their own results.
- Serve an exact excerpt with the indexed tag, citation and paragraph range when the revision and extraction status support a preview. Documents with incomplete or stale coverage can still return metadata. The extraction and classification labels travel with every preview.
- Keep this proof offline and deterministic. The application UI, actual evidence, source links, authentication, semantic retrieval, warehouse integration and deployment belong to subsequent work.

## Acceptance

- A keyword-only baseline ranks the synthetic extinction card first for “No US-China War.” The claim-aware proof ranks war-likelihood defense first and labels the extinction and war-likely cards separately.
- Likelihood, impacts and ambiguous queries exercise distinct paths. Tests also cover explicit clarification, restricted duplicates, empty grants, document fallback, revision conflicts, connector text, invalid boundaries, registry aliases and exact excerpts.
- Run the Node test suite, TypeScript check and production build. Record any environment-dependent tests that were skipped.

## Verification

The local Node suite passed 25 tests, including all six search tests. Nine existing PostgreSQL or capture-archive tests were skipped because their required inputs were unavailable. The TypeScript project check and Next.js production build passed. The fixture comparison measures the flagship example only. Relevance on the private corpus remains unmeasured.
