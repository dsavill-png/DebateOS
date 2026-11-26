# Neon Free development warehouse

The warehouse uses PostgreSQL 17, Drizzle's existing migration journal, and the existing `pg` driver. This setup is for fictional test records. TASK-011 archive replay remains separate and uses an offline temporary workspace with direct Dropbox access.

## Owner setup

1. In the [Neon Console](https://console.neon.tech/), create a development-only Free organization and a PostgreSQL 17 project named `debateos-dev`. Use the root as an empty template. Keep production in a separate owner-controlled account or organization. Do not upload Tabroom captures, production exports, or credentials to this development project.
2. Under **Branches → New branch**, create one disposable child from the template for each developer, agent, or test run, and a separate restore child. Under **Databases**, create `debateos_dev` on the test child and an empty `debateos_restore` on the restore child. In **Connect**, select the intended branch and database, disable pooling, and use the direct endpoint with `sslmode=verify-full`. Record the branch-to-endpoint mapping without passwords.
3. On a trusted temporary Linux runner with Node 24 and PostgreSQL 17 client tools, check out the intended commit, run `npm ci`, inject the test child's owner URL as `WAREHOUSE_DATABASE_URL`, and run `npm run db:migrate`. To test an upgrade, first migrate the child at the base revision, run the verification below to seed it, then migrate at the proposed revision and verify again against a fresh restore child. Keep owner URLs with the operator.
4. Open `psql -h <test-direct-host> -U <owner-role> -d debateos_dev -W` with `PGSSLMODE=verify-full PGSSLROOTCERT=system` and enter the owner password at the prompt. In psql run `\set ON_ERROR_STOP on`, then `\i scripts/warehouse-dev-access.sql` once per new branch. Run `\password debateos_dev_reader` and `\password debateos_dev_writer` with distinct generated passwords, then `ALTER ROLE debateos_dev_reader LOGIN;` and `ALTER ROLE debateos_dev_writer LOGIN;`. SQL-created logins avoid Neon console roles' elevated membership. The reader can select existing public relations. The writer can change synthetic Person rows. Migration and DDL are operator-run on test branches. [Neon roles](https://neon.com/docs/manage/roles)
5. Send a single branch-scoped login via an approved expiring vault share for a human, or inject it directly into the assigned agent runner's secret environment. Give each assignee their own branch. Do not grant agents organization membership, Neon API keys, owner URLs, or GitHub-wide secrets. Remove runner secrets and delete the disposable branch when work ends. For immediate revocation, disable the login and close active sessions or delete the branch. Never branch from production. [Neon branches](https://neon.com/docs/manage/branches)

## Seed and restore verification

In the operator runner, inject the direct source owner URL, restore owner URL, reader URL, and writer URL as `WAREHOUSE_DATABASE_URL`, `WAREHOUSE_RESTORE_DATABASE_URL`, `WAREHOUSE_DEV_READER_URL`, and `WAREHOUSE_DEV_WRITER_URL`. Run:

```sh
node scripts/verify-warehouse-dev.mjs
```

The check seeds three fictional People idempotently, verifies reader and writer permissions, and restores a temporary custom-format dump into the empty restore database. It verifies seed identity and migration history. Dumps omit ownership and grants on restore for portability. Reapply hosting-specific access policies separately. Keep the runner and its temporary storage isolated, record only pass/fail, and delete the restore branch after verification. Use a new empty restore database for each run. The four URLs belong to this verification harness only.

## Production decision after development testing

Compare measured compute, database and WAL sizes, restore time, and cold start on the synthetic pilot. At 10 CU-hours, 1 GB of data, and 1 GB of recovery history, Neon Launch plus Render cron is about $2.61/month before traffic and backups, with up to seven days of recovery. Launch uses a public TLS endpoint. Private Render PostgreSQL plus cron starts near $7.30/month with same-region internal connectivity and three-day recovery on Hobby. Prefer private Render if a private database path is required. If approved, retain encrypted logical backups under the authorized policy and test recovery on a separate restricted destination. [Neon plans](https://neon.com/docs/introduction/plans) · [Render pricing](https://render.com/pricing) · [Render recovery](https://render.com/docs/postgresql-backups)

Production selection, spending, protected storage, and credential provisioning require separate owner approvals. Live Tabroom access requires written authorization and separate pilot approval.
