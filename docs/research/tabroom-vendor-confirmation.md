# TASK-003 · Tabroom vendor confirmation

November 23, 2026. Draft for Dennis to review. Outreach requires Dennis's separate approval.

## Official route

Tabroom Support, `help@tabroom.com`, is the software support inbox listed on [Help with Tabroom](https://www.tabroom.com/index/help.mhtml). The same page has a section on API integrations. The inbox is general software support and can route the request to the technical team. No dedicated developer intake is listed there.

The help page says Tabroom has no publicly accessible documented API for external integration, its technical team currently cannot onboard external services, and future API news will be announced in the newsletter. It describes `/api/download_data.mhtml` as an individual-use tournament JSON export with access-dependent coverage. The [prior discovery](tabroom-authenticated-access.md) records an IndexCards OpenAPI document describing cookie sessions and the login route. That technical evidence establishes no third-party support or authorization. The supported credential model, lifetimes, endpoint entitlements, limits, data uses, and pilot scope remain open.

## Draft email

**To** `help@tabroom.com`  
**Subject** Supported Tabroom access for internal college debate research

Hi Tabroom Support,

I’m preparing DebateOS, an internal college debate coaching and research platform. We’d like to confirm whether Tabroom supports a read-only integration for this use. If another team handles API policy, could you route this request to them?

1. Is there an approved authentication method for a third-party backend? Is the session cookie issued by `POST /v1/auth/login` supported for unattended server use, or should we use a different credential model or an approved export?
2. For any supported session, what are the idle and absolute lifetimes, and how should we renew it or re-authenticate?
3. Which account roles and scopes may read each route below, relative to `/v1`? In particular, how do own-record, other-person, tournament-affiliation, and published-result permissions differ?

   - `/rest/paradigms/{personId}`
   - `/rest/paradigms/{personId}/record`
   - `/rest/tourns/{tournId}/rounds`
   - `/rest/tourns/{tournId}/schedule`
   - `/rest/tourns/{tournId}/results`
   - `/rest/tourns/{tournId}/results/{resultSetId}`
   - `/pages/invite/{tournId}/{eventAbbr}/{roundName}/results`

4. What rate limits, request cadence, concurrency, and retry guidance should we follow?
5. May we store normalized copies of returned judge paradigms and judging-history records in a private internal database? May we use them to derive internal coaching analytics? What retention, deletion, republication, sharing, or user-consent restrictions should apply to the records and derived outputs?
6. Before any broader use, would you permit a one-time comparison of a small sample from my own Tabroom judge record against supported API responses? If so, what routes, request cap, and data-handling conditions would you approve?

If third-party backend access is currently unavailable, a confirmation of that and any approved alternative would help us plan.

Thanks,
Dennis
