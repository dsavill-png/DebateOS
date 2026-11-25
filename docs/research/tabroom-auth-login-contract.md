# Tabroom authenticated login contract pin

**Captured for** TASK-023  
**Captured** 2026-11-25  
**Purpose** Provide a local, reviewable login contract when `api.tabroom.com` is unreachable from GitHub Actions.

## Verified contract

The canonical Tabroom v4 source establishes the following login/session behavior:

- base API: `https://api.tabroom.com/v1`
- operationId: `authLogin`
- method/path: `POST /v1/auth/login`
- request content type: `application/json`
- request body credential fields: `username` and `password`
- success status: `200`
- success body: a `LoginResponse` containing `Person` identity data; the session key is **not** returned in the JSON body
- session transport: the server creates the session and sends the session key in the response cookie
- authentication scheme: `cookieAuth`, an OpenAPI `apiKey` scheme with `in: cookie`
- cookie name: `TabroomToken` by default (`config.cookie.name`)
- cookie attributes: `httpOnly: true`, `sameSite: lax`, `path: /`, domain `.tabroom.com` by default, and `secure: true` in production
- bad credentials: `401`
- banned account: `403`
- protected requests authenticate by returning the `TabroomToken` cookie; callers must not invent a body token or authorization header

Synthetic request example only:

```json
{
  "username": "synthetic-user",
  "password": "synthetic-password"
}
```

No real username, password, cookie or session value belongs in this repository.

## Canonical provenance

The live `api.tabroom.com` OpenAPI host could not be resolved from the 2026-11-25 GitHub Actions runner. The missing cookie semantics are nevertheless directly documented in the public `speechanddebate/Tabroomv4` source at commit `307859c9aa7fb54daddd9f9a8206264b9ba98fb6`.

Relevant canonical files:

- `indexcards/api/routes/routers/v1/authRouter.ts` — declares `POST /auth/login`, `authLogin`, JSON request body and 200 response schema.
- `indexcards/api/controllers/authController.ts` — calls `res.cookie(config.cookie.name, token, ...)` and returns the validated `Person` response body.
- `indexcards/api/routes/openapi/security.ts` — declares `cookieAuth` as `type: apiKey`, `in: cookie`, with name `config.cookie.name`.
- `indexcards/api/config.ts` — defaults `config.cookie.name` to `TabroomToken` and domain to `.tabroom.com`.
- `indexcards/api/services/AuthService.ts` — creates the session key and defines the auth cookie options.
- `indexcards/docs/auth.md` — explicitly states that `POST /v1/auth/login` creates a session, sets the cookie, and that the session key is only in the cookie, never the body.

Canonical repository links:

- https://github.com/speechanddebate/Tabroomv4/blob/307859c9aa7fb54daddd9f9a8206264b9ba98fb6/indexcards/docs/auth.md
- https://github.com/speechanddebate/Tabroomv4/blob/307859c9aa7fb54daddd9f9a8206264b9ba98fb6/indexcards/api/controllers/authController.ts
- https://github.com/speechanddebate/Tabroomv4/blob/307859c9aa7fb54daddd9f9a8206264b9ba98fb6/indexcards/api/routes/openapi/security.ts
- https://github.com/speechanddebate/Tabroomv4/blob/307859c9aa7fb54daddd9f9a8206264b9ba98fb6/indexcards/api/config.ts
- https://github.com/speechanddebate/Tabroomv4/blob/307859c9aa7fb54daddd9f9a8206264b9ba98fb6/indexcards/api/services/AuthService.ts

## Correction to the earlier pin

The earlier local pin relied on a third-party OpenAPI-to-MCP recipe that described a response `token` path. That was not authoritative enough for TASK-023 and was incomplete for cookie-session implementation.

The canonical Tabroom v4 source resolves the ambiguity: the login service internally receives a generated session token, but the HTTP controller places that value in the `TabroomToken` response cookie and does **not** return the session key in the response JSON.

TASK-023 must therefore treat `Set-Cookie: TabroomToken=...` as the authenticated session establishment mechanism and keep the cookie value inside the session provider.

## Session lifetime note

The API login path creates a session without passing an explicit expiry. Tabroom's auth documentation states that a null `session.expires` does not expire; classic may set an expiry for other login flows such as one-time-password login. TASK-023 should still handle 401/session invalidation and controlled re-login rather than assuming a permanent session.

## TASK-023 implementation rule

When the live Tabroom OpenAPI document is reachable, implementation should verify this pin against the live description before production rollout. When the live host is unreachable in CI, the canonical Tabroom v4 source above is the approved contract for the bounded TASK-023 implementation and synthetic tests.

The later local runtime proof on Dennis's machine must validate actual login behavior without printing or persisting secrets and must stop cleanly if live behavior contradicts this source-backed pin.
