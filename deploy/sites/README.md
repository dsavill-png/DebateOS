# Private DebateOS Sites deployment

The application routes and search modules live in the existing DebateOS source tree. Sites runs the App Router UI through the Vinext Worker adapter. The Worker forwards the two evidence routes to the shared TypeScript server code.

Copy the arguments route to the Sites starter's `src/app/arguments` and its search files to `src/argument-search`. Keep the starter layout at `src/app/layout.tsx`, remove the starter home route and copy `worker.ts` to `worker/index.ts`. Set the Sites hosting manifest's R2 binding to `EVIDENCE_SNAPSHOTS`. R2 stores one pinned baseline export as a private object. PostgreSQL remains the accepted warehouse for durable structured data.

Set `DEBATEOS_OWNER_EMAIL` from the Site owner and `DEBATEOS_SNAPSHOT_SHA256` from the validated export. Set `DEBATEOS_IMPORT_TOKEN` as a runtime secret to authorize one bootstrap upload through the private Site service access route. Remove it after verifying the import. The search API requires the platform-authenticated owner email and rejects other visitors. Keep the deployment owner-private.

The export must include only explicitly eligible cohort sources with verified paths, checked revisions and exact excerpt fields. Use `makeSearchSnapshot` to create the versioned payload, hash it, publish configuration and upload the identical bytes. Report the snapshot check date in the UI. Older exports stay addressable in R2 only by the configured hash. This baseline workflow has no weekly automation of its own.

Never copy evidence exports, source locators, consent tokens, or runtime secrets into Git.
