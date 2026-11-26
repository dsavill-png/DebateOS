# Tabroom authentication and five-judge pilot checklist

## 1. Approve access and select the environment

1. Obtain written Tabroom approval for a permanent service identity, supported authentication and renewal, allowed endpoints and fields, request limits, retention and permitted use. Record the approval under TASK-003.
2. Identify an existing cloud worker, secret store, approved outbound network path, private PostgreSQL and protected capture storage. Confirm isolation, capacity and incremental cost with the cloud owner. Prefer a manually invoked worker on this stack. Keep scheduled execution and serving disabled.
3. Approve the environment, access roles, retention, cost ceiling and named security operator. If private PostgreSQL is the only missing component, price a temporary single-AZ instance on the existing network, including storage and teardown.

## 2. Provision only after approval

1. Have the named operator establish the approved service identity, put its credential in the existing vault and grant read access to the collector workload role. Give the operator separate rotation and revocation access. Keep credential values out of source control, development tools, CI and logs.
2. Restrict outbound access to approved endpoints and give the worker a scoped database role for staging and checkpoints. Verify environment isolation, audit events, log redaction, rotation, revocation and the stop mechanism using synthetic data.
3. Verify the exact importer revision in credential-free CI. In approved cloud workspace storage, download the original TASK-011 archive directly from Dropbox, verify the ZIP and manifest digests, and replay against the pinned manifest. Independently deduplicate explicit provider Person IDs from qualifying assigned judges. Compare with 401 and record discrepancies and the worklist digest. [Archive and replay instructions](https://github.com/dsavill-png/DebateOS/blob/d83f19678d31600715611d32fd0f111d39c64843/docs/handoffs/2026-11-23-college-policy-public-coverage.md)

## 3. Execute and reconcile after pilot approval

1. Approve five explicitly linked judges across activity levels and divisions. Cap initial activity at ten history and paradigm requests plus a separately agreed pagination and retry allowance. Specify the approved retention window and operator.
2. Run the worker manually. Stop on authorization failure, scope drift, ambiguous identity, unknown mapping or exhausted request budget. Commit data and cursor together in PostgreSQL under a lease. Record only sanitized execution counts in operational logs.
3. Before retaining an approved capture, allowlist the fields required for validation and remove credentials, cookies, session identifiers, contact details and unrelated person data from derived records and diagnostics. Keep authorized source evidence encrypted and access-scoped under its approved retention policy. Use synthetic or redacted excerpts in GitHub and review reports. Verify redaction on the synthetic fixture before release.
4. For each judge, reconcile identity, date and time zone, level, event, round, sides, individual vote, panel result and field lineage where evidence supports them. Compare paradigm text with an authorized event-level bulk PDF. Compare counts with authorized seasonal totals or the underlying Record view, matching academic year, judge identity and competition scope. Record source dates, coverage differences and unavailable comparisons. [Paradigm PDFs](https://docs.tabroom.com/public/tournament-info) · [Seasonal totals](https://docs.tabroom.com/entries/judges)
5. Confirm repeat-run deduplication, checkpoint recovery, quarantines and revision reconciliation. Record the decision and keep serving disabled. Seek separate approval before expanding collection.

