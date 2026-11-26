-- Run as the migration owner on a disposable synthetic child branch.
-- Set passwords separately with psql's interactive \password command.
BEGIN;
DO $guard$
BEGIN
  IF current_database() <> 'debateos_dev' THEN
    RAISE EXCEPTION 'Expected the synthetic debateos_dev database';
  END IF;
END
$guard$;
REVOKE CONNECT, TEMPORARY ON DATABASE debateos_dev FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
CREATE ROLE debateos_dev_reader NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE debateos_dev_writer NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
GRANT CONNECT ON DATABASE debateos_dev TO debateos_dev_reader, debateos_dev_writer;
GRANT USAGE ON SCHEMA public TO debateos_dev_reader, debateos_dev_writer;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO debateos_dev_reader;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.persons TO debateos_dev_writer;
COMMIT;
