# Current architecture and authority boundaries

## Observed operating model
1. The enabled weekly ChatGPT automation scans the authorized Dropbox **2026–27 Arms Sales** root, by cursor-paginated inventory, tracking IDs, paths, dates, sizes and revision/hash fingerprints when available.
2. It compares this inventory to the last verified manifest. It prioritizes changed current sources, then a capped backlog of unparsed nonempty sources.
3. It derives source-linked card and analytic *candidates*, document manifest entries and change events. It does not authorize generated material as debate evidence.
4. It stages changes, validates them, checks concurrent edits and publishes to the existing **Google Drive / AI Workspace / SNU_AI_CONTEXT** records. The final run state is committed last.
5. It sends a weekly report; strategically material changes enter coach review rather than silently replacing reviewed meaning.

This description is based on the current Drive `00_READ_ME_FIRST.md`, `05_STATE/REFRESH_PROTOCOL.md`, `04_SCHEMA/RECORD_SCHEMAS.md`, `05_STATE/INGESTION_STATUS.md` and the automation's November 23 report. It does not establish a separate runnable script or deployment.

## Authority table
| Asset | Authority now | GitHub role |
|---|---|---|
| Current original evidence/document bytes | Authorized Dropbox source | No copy of private bodies |
| Canonical debate strategy/coach-reviewed meaning | Current originals and reviewed Drive registry | Document interface and review protocol only |
| Derived indexes, manifests, run history, pending review | Current SNU_AI_CONTEXT Google Drive IDs | Describe schema, test contracts; no competing live state |
| Weekly cadence and actual execution | Enabled ChatGPT automation | No scheduler change |
| DebateOS application code/warehouse design | GitHub `AGENTS.md`, architecture ADRs, task/PR process | Preserve current engineering ownership |
| Future tested SNU context processing code | Not yet established here | Candidate for source control after review and sanitization |

**Do not treat Dropbox file synchronization as a running PostgreSQL server.** The SNU context refresh is a separate, currently Drive-published derivative knowledge layer. A future import into the DebateOS canonical warehouse requires a new authorization, provenance and access-control design.

## Public-repository security boundary
The DebateOS repository is public. Only non-sensitive operational descriptions, anonymized or synthetic fixtures, code without secrets, and documentation of general schemas may be proposed here. Detailed student activity, named people, unreleased case strategy, source card content, restricted Tabroom material, file indexes and local paths with sensitive context are not suitable for the public repo without separate approval.

## Potential failure modes to design for
- Connector failure mid-download: abort without publishing partial indexes.
- Interrupted publication: preserve Drive object identity; verify staging hashes against old/new targets before resuming.
- Concurrent edit to Drive: stop instead of overwriting an unknown revision.
- Source move or rename: reconcile by stable Dropbox file ID, not filename alone.
- Zero-byte or unsupported DOCX: exception queue rather than false deletion or successful parse.
- Missing original: never upgrade connector-extracted text to original-DOCX verification.
- Candidate extraction: never count a parsed candidate as coach-accepted strategy.
- Weekly scan shows no changed files: backlog may still require processing.
- Parallel runner: explicitly guard against two systems publishing to the same live Drive state.

## Reference links
- [SNU_AI_CONTEXT folder](https://drive.google.com/drive/folders/1iZnsREA_YWM5rM7RMBxqUZu9-ZohboDV)
- [Drive refresh protocol](https://drive.google.com/file/d/1H9I8qPbk6XG7jj5_Mp2rKNNVM7VW9bc3/view)
- [Drive record schemas](https://drive.google.com/file/d/1EOiWOZ2cQ5NHeBP7mjN31G4agt3M4RZU/view)
- [DebateOS AGENTS](../AGENTS.md) and [roadmap](../PLANS.md)
