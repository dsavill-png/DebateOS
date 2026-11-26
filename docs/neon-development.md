# Neon Free development warehouse

The warehouse uses PostgreSQL 17, Drizzle's existing migration journal, and the existing `pg` driver. This setup is for fictional test records. TASK-011 archive replay remains separate and uses an offline temporary workspace with direct Dropbox access.

## Owner setup

1. In the [Neon Console](https://console.neon.tech/), use an owner-controlled Free PostgreSQL 17 project dedicated to synthetic development. Keep an empty branch as the template and use two disposable children from it. Create `debateos_dev` on the source child and an empty `debateos_restore` on the restore child. Keep Tabroom captures, production exports, and production credentials out of this project.
2. In **Connect**, select the intended child, database, and owner role, then turn pooling off. Supply the two direct URLs through the private runner's secret store. Use hostname verification and required channel binding. Keep the branch-to-endpoint mapping with the operator.
3. Run **Verify synthetic Neon warehouse** in the owner-controlled private GitHub repository. Use fresh mode to apply the existing Drizzle migrations or resume mode to check the pinned migration history on an existing synthetic source. Start with an empty restore target for every full drill. The workflow creates least-privilege reader and writer logins through SQL and removes them at the end. Neon accepts a generated password for SQL role creation and stores it using SCRAM. Its role policy rejects pre-hashed passwords. [Neon roles](https://neon.com/docs/manage/roles)
4. Keep the owner URLs with the operator and remove runner secrets after the verification window closes. For any separately approved developer access, give each assignee their own disposable branch and only the restricted login required for their task. Confirm the login's effective access before handing it out. [Neon branches](https://neon.com/docs/manage/branches)

## Hosted verification

On November 26, 2026, the private workflow passed against reviewed DebateOS revision `ad5acfa88f3d6c7e8fcde14db70e56515dfa46a0`. It verified the application build, PostgreSQL 17 connectivity using native clients, the migration history, synthetic seed data, reader and writer permissions, writer rollback, logical backup and transactional restore, restored fixture and migration history, and removal of temporary roles. An earlier run applied the same migrations successfully. The successful run used resume mode.

The hosted workflow is the reusable verification path. It archives only the warehouse and migration schemas and omits source ownership and grants on restore. The restore retains the target's existing `public` schema and creates the archived objects inside it. The archive stays on the ephemeral runner. Detailed run evidence and operator instructions are retained in the private repository.

## Production decision after development testing

Compare measured compute, database and WAL sizes, restore time, and cold start on the synthetic pilot. At 10 CU-hours, 1 GB of data, and 1 GB of recovery history, Neon Launch plus Render cron is about $2.61/month before traffic and backups, with up to seven days of recovery. Launch uses a public TLS endpoint. Private Render PostgreSQL plus cron starts near $7.30/month with same-region internal connectivity and three-day recovery on Hobby. Prefer private Render if a private database path is required. If approved, retain encrypted logical backups under the authorized policy and test recovery on a separate restricted destination. [Neon plans](https://neon.com/docs/introduction/plans) · [Render pricing](https://render.com/pricing) · [Render recovery](https://render.com/docs/postgresql-backups)

Production selection, spending, protected storage, and credential provisioning require separate owner approvals. Live Tabroom access requires written authorization and separate pilot approval.
