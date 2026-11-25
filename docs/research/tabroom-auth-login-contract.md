# Tabroom authenticated login contract pin

**Captured for** TASK-023  
**Captured** 2026-11-25  
**Purpose** Provide a local, reviewable login contract when `api.tabroom.com` is unreachable from GitHub Actions.

## Verified contract

The Tabroom IndexCards API login operation is:

- base API: `https://api.tabroom.com/v1`
- operationId: `authLogin`
- method/path: `POST /v1/auth/login`
- request body: JSON object with exactly the credential fields `username` and `password`
- login response token path: `token`
- authentication scheme populated from that token: `cookieAuth`

Synthetic example only:

```json
{
  "username": "synthetic-user",
  "password": "synthetic-password"
}
```

No real username, password, cookie or token value belongs in this repository.

## Provenance and confidence

The live Tabroom OpenAPI host could not be resolved from the 2026-11-25 GitHub Actions runner or the ChatGPT working container. Earlier TASK-003 research had already verified that the live IndexCards OpenAPI v1.2.0 documents cookie-session authentication and `POST /v1/auth/login`, but had not retained the exact request/response schema.

For TASK-023, the missing schema was cross-checked against a public OpenAPI-to-MCP implementation that dynamically reads the Tabroom description and publishes a preconfigured Tabroom recipe. Its published documentation states:

- Tabroom alias URL: `https://api.tabroom.com/v1`
- login operationId: `authLogin`
- login response token path: `token`
- login scheme: `cookieAuth`
- login request body fields: `username` and `password`

Sources inspected 2026-11-25:

- https://glama.ai/mcp/servers/gmitch215/MyMCP
- https://glama.ai/mcp/servers/gmitch215/MyMCP/tree

This pin is intentionally minimal. It does not claim vendor approval for third-party production integration, session lifetime, role entitlements, rate limits, or persistence rights.

## TASK-023 implementation rule

When the live Tabroom OpenAPI document is reachable, implementation should verify this pin against the live description before a production rollout. When the live host is unreachable in CI, this file is the approved local contract for the bounded TASK-023 implementation and synthetic tests.

The later local runtime proof on Dennis's machine must still validate actual login behavior without printing or persisting secrets and must stop cleanly if the live response contradicts this pin.
