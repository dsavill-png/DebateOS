# TASK-023 local Tabroom validation

The hosted path is `SecretProvider → TabroomSessionProvider → allowlisted authenticated adapter → canonical DebateOS ingestion`. The implemented seam is `openTabroomSession`. A future per-user server-side vault can implement `SecretProvider` without changing the session or validation caller. The session exposes its login Person ID and one GET operation scoped to that Person. Canonical ingestion remains a future approval. The local proof clears its in-memory cookie when it finishes and treats HTTP 401 as session expiry.

## After code review

On Dennis's machine, use Node 24 and an approved local secret source that injects `DEBATEOS_TABROOM_USERNAME` and `DEBATEOS_TABROOM_PASSWORD` into the process environment. Run:

```sh
node scripts/tabroom-gold-record.ts /absolute/private/path/gold-sample.json
```

The proof verifies that the live login returns HTTP 200, a numeric Person ID and a `TabroomToken` cookie before issuing the GET. It stops on a contradictory response or a different Person ID. Expect at most three requests including login, the record GET and one possible GET retry. Each request has a 15-second timeout. The documented person-record endpoint returns the account's record collection, and the comparison uses at most five reference rows.

Prepare the JSON sample locally from the supplied 15-page record. Use the signed-in Person ID and verified record keys to identify each row. Include a split panel if the source contains one. The example below uses synthetic values and illustrative field paths. Confirm actual paths against authorized local evidence. Keep the sample and any protected source material private.

```json
{
  "personId": 42,
  "rows": [
    {
      "match": [
        { "path": ["panelId"], "value": 11 }
      ],
      "fields": {
        "individualVote": { "expected": "Aff", "path": ["vote"] },
        "panelResult": { "expected": "Neg", "path": ["result"] }
      }
    }
  ]
}
```

The other field keys are `tournament`, `level`, `date`, `event`, `round`, `aff` and `neg`. For mappings supported by source evidence, supply a property path relative to the matched record and the expected string or number from the reference. A field can specify `"transform": "trim"` or `"transform": "number-to-string"`. Leave paths unset where the source mapping is unresolved, including team sides and panel result if the record supplies only the individual vote. Use all required keys for the match and preserve the source paths in the private sample. Duplicate matches produce ambiguous field statuses. The console matrix contains row ordinals and statuses only.
