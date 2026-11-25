# 023 · Cloud-ready Tabroom authenticated session provider and gold-record validation

**Status** Approved / Released  
**Owner** Dennis Commander  
**Worker** Codex  
**Dispatch** Ready  
**Review** Chat with Dennis. Jared owns downstream UI-facing integration.  
**Priority** High

## Objective

Implement the first cloud-ready authenticated Tabroom access seam for DebateOS, then use it for a **bounded, read-only gold-record validation** against Dennis's 15-page Tabroom judge record.

This task is the bridge between the existing public-only Tabroom adapter and the future enterprise DebateOS service. It must prove authenticated access without making the public adapter depend on credentials and without committing or persisting secret values.

The architectural destination is a multi-user cloud service in which authorized DebateOS users can connect their Tabroom accounts and DebateOS can maintain server-side sessions using an approved secret backend. The first proof uses Dennis's account locally.

## Required source reading

Read and preserve:

- `AGENTS.md`
- `PLANS.md`
- `PROJECT_STATE.md`
- `tasks/003-tabroom-authentication.md`
- `tasks/014-authenticated-judge-record-api-validation.md`
- `docs/research/tabroom-authenticated-access.md`
- `src/tabroom/adapter.ts`
- `src/tabroom/openapi.ts`
- `test/tabroom.test.ts`

No architecture substitution.

## Scope

### 1. Secret-provider seam

Define a small injectable credential/secret abstraction suitable for both:

- a local Dennis-authorized proof; and
- a future cloud secret manager.

Requirements:

- no username/password/cookie/token values committed to GitHub;
- no secret values written to PostgreSQL, Dropbox, fixtures, logs, task output, test snapshots, command arguments, or error messages;
- tests must use synthetic credentials only;
- production-facing code must not require a plaintext `.env` file;
- the provider contract must allow later replacement with a cloud vault without changing Tabroom application consumers.

A local proof may receive credentials through an interactive or OS-protected/injected source. Do not build a bespoke encryption format.

### 2. Authenticated session provider

Create a separate authenticated Tabroom transport/session provider. Do **not** weaken or alter the existing anonymous-public adapter contract.

Requirements:

- use the first-party Tabroom cookie-session authentication mechanism already documented by TASK-003;
- verify the exact login request/response semantics from the live/pinned Tabroom API specification before implementation;
- hold session cookies in memory for the proof;
- support clean session expiry/unauthorized errors;
- never log cookie values;
- do not expose cookie values to higher application layers;
- make the session transport injectable/testable;
- preserve explicit request timeout and bounded retry behavior;
- read-only operations only after login.

If the documented login contract cannot be implemented without guessing request fields, stop and report **Blocked** rather than scraping HTML or inventing headers.

### 3. Allowlisted authenticated reads

For this proof, expose only the smallest authenticated read set required to validate Dennis's judge record, preferably:

- person/paradigm metadata needed to establish the judge Person;
- the authenticated judge history record endpoint;
- any narrowly required published round/result join endpoint already observed in TASK-003.

Do not implement broad tournament/account harvesting in this task.

### 4. Gold-record validator

Implement a validator that compares a bounded sample from Dennis's supplied 15-page record against authenticated API data.

Required fields:

- tournament;
- level;
- date;
- event;
- round;
- Aff;
- Neg;
- Dennis's individual vote;
- overall panel result when present.

Requirements:

- preserve individual vote and panel result as distinct facts;
- include at least one split-panel example where the individual vote differs from the panel result if the supplied record contains one;
- classify each field as exact, explainable transform, unavailable, ambiguous, or mismatch;
- do not infer winners from ambiguous structures;
- do not persist protected response bodies in GitHub;
- validation output committed to GitHub must be sanitized and contain no credentials, cookies, or protected free-text beyond the minimum approved comparison values;
- keep protected raw bodies local/private.

### 5. Enterprise compatibility

The implementation must document the future hosted path:

`SecretProvider -> TabroomSessionProvider -> allowlisted authenticated adapter -> canonical DebateOS ingestion`

The local proof must not couple the adapter to Windows Credential Manager, one laptop, one username, or one secret vendor. Platform-specific secret storage may be an implementation of `SecretProvider`, not the application contract.

## Non-goals

This task does **not** authorize:

- mass ingestion of every judge's authenticated record;
- HTML scraping as an authentication or data fallback;
- storing Dennis's credentials or session material in the repository or Dropbox;
- exposing authenticated raw responses through the public API;
- merging protected data into the public judge mart;
- production multi-user credential onboarding;
- claiming Tabroom-supported third-party app integration beyond what has been verified.

## Acceptance criteria

- Existing public adapter tests remain unchanged in meaning and pass.
- New tests prove public requests still omit credentials.
- New tests prove authenticated requests use only the session provider and never surface secrets to caller-visible diagnostics.
- Synthetic login/session tests cover success, 401/expiry, malformed login response, timeout/retry boundaries, and secret-redaction behavior.
- Gold-record comparison can run through the authenticated provider with a bounded request cap.
- A dry/synthetic fixture proves individual vote and panel result remain separate when they differ.
- TypeScript and production build pass.
- No secret-bearing file is introduced.
- A concise handoff documents local proof steps and the future cloud-vault seam.

## Runtime proof

After code review, run the local proof on Dennis's machine with credentials entered only through the approved local secret source. Do not paste credentials into ChatGPT, GitHub, Dropbox, CI variables visible to logs, or task comments.

The proof should:

1. establish an authenticated session;
2. verify account/session access without printing secrets;
3. fetch only the allowlisted judge-record data;
4. compare the bounded gold sample;
5. emit a sanitized field matrix;
6. discard the session.

If the live proof requires a user action on Dennis's machine that Codex cannot perform, stop at the tested implementation and provide the exact one-command/local step needed to complete the proof.

## Completion handoff

Report:

- STATUS
- WHAT I DID
- WHAT CHANGED
- TEST RESULTS
- NEW INFORMATION
- ARCHITECTURE CONFLICTS
- FILES / COMMITS
- RECOMMENDED NEXT STEP
