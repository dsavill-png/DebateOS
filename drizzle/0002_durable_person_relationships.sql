CREATE TABLE "person_role_observations" (
  "evidence_id" uuid PRIMARY KEY NOT NULL,
  "person_id" uuid NOT NULL,
  "role" text NOT NULL,
  "verification" text NOT NULL,
  "temporal_precision" text NOT NULL,
  "effective_start" date,
  "effective_end" date,
  "observed_on" date,
  CONSTRAINT "person_role_verification" CHECK ("verification" in ('unverified', 'verified', 'conflicting', 'rejected')),
  CONSTRAINT "person_role_allowed" CHECK ("role" in ('debater', 'judge', 'coach')),
  CONSTRAINT "person_role_dates" CHECK (case "temporal_precision"
    when 'exact-interval' then "effective_start" is not null and "effective_end" is not null
      and "effective_start" <= "effective_end"
    when 'start-only' then "effective_start" is not null and "effective_end" is null
    when 'end-only' then "effective_start" is null and "effective_end" is not null
    when 'event-only' then "effective_start" is null and "effective_end" is null and "observed_on" is not null
    when 'unknown' then "effective_start" is null and "effective_end" is null and "observed_on" is null
    else false
  end)
);
--> statement-breakpoint
ALTER TABLE "person_role_observations" ADD CONSTRAINT "person_role_observations_evidence_id_warehouse_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."warehouse_evidence" ("id");
--> statement-breakpoint
ALTER TABLE "person_role_observations" ADD CONSTRAINT "person_role_observations_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons" ("id");
--> statement-breakpoint
CREATE TABLE "person_institution_affiliations" (
  "evidence_id" uuid PRIMARY KEY NOT NULL,
  "person_id" uuid NOT NULL,
  "chapter_id" uuid NOT NULL,
  "role" text,
  "verification" text NOT NULL,
  "temporal_precision" text NOT NULL,
  "effective_start" date,
  "effective_end" date,
  "observed_on" date,
  CONSTRAINT "person_affiliation_verification" CHECK ("verification" in ('unverified', 'verified', 'conflicting', 'rejected')),
  CONSTRAINT "person_affiliation_role_allowed" CHECK ("role" in ('debater', 'judge', 'coach')),
  CONSTRAINT "person_affiliation_dates" CHECK (case "temporal_precision"
    when 'exact-interval' then "effective_start" is not null and "effective_end" is not null
      and "effective_start" <= "effective_end"
    when 'start-only' then "effective_start" is not null and "effective_end" is null
    when 'end-only' then "effective_start" is null and "effective_end" is not null
    when 'event-only' then "effective_start" is null and "effective_end" is null and "observed_on" is not null
    when 'unknown' then "effective_start" is null and "effective_end" is null and "observed_on" is null
    else false
  end)
);
--> statement-breakpoint
ALTER TABLE "person_institution_affiliations" ADD CONSTRAINT "person_institution_affiliations_evidence_id_warehouse_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."warehouse_evidence" ("id");
--> statement-breakpoint
ALTER TABLE "person_institution_affiliations" ADD CONSTRAINT "person_institution_affiliations_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons" ("id");
--> statement-breakpoint
ALTER TABLE "person_institution_affiliations" ADD CONSTRAINT "person_institution_affiliations_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters" ("id");
--> statement-breakpoint
CREATE TABLE "student_person_evidence" (
  "evidence_id" uuid PRIMARY KEY NOT NULL,
  "student_id" uuid NOT NULL,
  "person_id" uuid,
  "basis" text,
  "verification" text NOT NULL,
  CONSTRAINT "student_person_evidence_candidate_key" UNIQUE ("evidence_id", "student_id", "person_id"),
  CONSTRAINT "student_person_verification" CHECK ("verification" in ('unverified', 'verified', 'conflicting', 'rejected')),
  CONSTRAINT "student_person_explicit_basis" CHECK (("person_id" is null and "basis" is null and "verification" = 'unverified')
    or ("person_id" is not null and "basis" is not null
      and "basis" in ('explicit-source', 'validated-crosswalk')))
);
--> statement-breakpoint
ALTER TABLE "student_person_evidence" ADD CONSTRAINT "student_person_evidence_evidence_id_warehouse_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."warehouse_evidence" ("id");
--> statement-breakpoint
ALTER TABLE "student_person_evidence" ADD CONSTRAINT "student_person_evidence_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students" ("id");
--> statement-breakpoint
ALTER TABLE "student_person_evidence" ADD CONSTRAINT "student_person_evidence_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons" ("id");
--> statement-breakpoint
CREATE TABLE "entry_person_memberships" (
  "evidence_id" uuid NOT NULL,
  "entry_id" uuid NOT NULL,
  "person_id" uuid NOT NULL,
  "student_id" uuid,
  "identity_evidence_id" uuid,
  "verification" text NOT NULL,
  CONSTRAINT "entry_person_memberships_pk" PRIMARY KEY ("evidence_id", "entry_id", "person_id"),
  CONSTRAINT "entry_person_verification" CHECK ("verification" in ('unverified', 'verified', 'conflicting', 'rejected')),
  CONSTRAINT "entry_person_student_lineage" CHECK (("student_id" is null) = ("identity_evidence_id" is null))
);
--> statement-breakpoint
ALTER TABLE "entry_person_memberships" ADD CONSTRAINT "entry_person_memberships_evidence_id_warehouse_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."warehouse_evidence" ("id");
--> statement-breakpoint
ALTER TABLE "entry_person_memberships" ADD CONSTRAINT "entry_person_memberships_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries" ("id");
--> statement-breakpoint
ALTER TABLE "entry_person_memberships" ADD CONSTRAINT "entry_person_memberships_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons" ("id");
--> statement-breakpoint
ALTER TABLE "entry_person_memberships" ADD CONSTRAINT "entry_person_memberships_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students" ("id");
--> statement-breakpoint
ALTER TABLE "entry_person_memberships" ADD CONSTRAINT "entry_person_identity_candidate_fk" FOREIGN KEY ("identity_evidence_id", "student_id", "person_id") REFERENCES "public"."student_person_evidence" ("evidence_id", "student_id", "person_id");
--> statement-breakpoint
-- Follow provenance parents as well as the immediate evidence and capture.
CREATE VIEW warehouse_public_relationship_evidence WITH (security_barrier = true) AS
WITH RECURSIVE roots(id) AS (
  SELECT evidence_id FROM person_role_observations
  UNION SELECT evidence_id FROM person_institution_affiliations
  UNION SELECT evidence_id FROM student_person_evidence
  UNION SELECT evidence_id FROM entry_person_memberships
), lineage(root_id, evidence_id) AS (
  SELECT id, id FROM roots
  UNION
  SELECT lineage.root_id, links.parent_evidence_id
  FROM lineage
  JOIN warehouse_evidence_relationships links USING (evidence_id)
  WHERE links.parent_evidence_id IS NOT NULL
)
SELECT root_id AS evidence_id
FROM lineage
LEFT JOIN warehouse_public_evidence eligible ON eligible.id = lineage.evidence_id
GROUP BY root_id
HAVING bool_and(eligible.id IS NOT NULL);
--> statement-breakpoint
CREATE VIEW public_person_role_observations WITH (security_barrier = true) AS
SELECT observation.*
FROM person_role_observations observation
JOIN warehouse_public_relationship_evidence eligible USING (evidence_id)
JOIN warehouse_evidence_relationships link ON link.evidence_id = observation.evidence_id
  AND link.person_id = observation.person_id;
--> statement-breakpoint
CREATE VIEW public_person_institution_affiliations WITH (security_barrier = true) AS
SELECT affiliation.*
FROM person_institution_affiliations affiliation
JOIN warehouse_public_relationship_evidence eligible USING (evidence_id)
JOIN warehouse_evidence_relationships link ON link.evidence_id = affiliation.evidence_id
  AND link.person_id = affiliation.person_id AND link.chapter_id = affiliation.chapter_id;
--> statement-breakpoint
CREATE VIEW public_student_person_assertions WITH (security_barrier = true) AS
SELECT assertion.*, capture.fetched_at
FROM student_person_evidence assertion
JOIN warehouse_public_relationship_evidence eligible USING (evidence_id)
JOIN warehouse_evidence_relationships link ON link.evidence_id = assertion.evidence_id
  AND link.student_id = assertion.student_id AND link.person_id IS NOT DISTINCT FROM assertion.person_id
JOIN warehouse_evidence source ON source.id = assertion.evidence_id AND source.output_role = 'student-person'
JOIN warehouse_captures capture ON capture.id = source.snapshot_id;
--> statement-breakpoint
-- A candidate needs verified support. A conflicting assertion or several live
-- candidates prevent resolution. Rejections supersede older assertions for the
-- same candidate. Equal capture times remain tied.
CREATE FUNCTION public_student_person_as_of(cutoff timestamptz)
RETURNS TABLE (student_id uuid, person_id uuid)
LANGUAGE sql STABLE
AS $$
  WITH latest AS (
    SELECT assertion.*,
      dense_rank() OVER (
        PARTITION BY assertion.student_id, assertion.person_id ORDER BY fetched_at DESC
      ) AS recency
    FROM public_student_person_assertions assertion
    WHERE fetched_at <= cutoff AND assertion.person_id IS NOT NULL
  ), candidates AS (
    SELECT latest.student_id, latest.person_id,
      bool_or(verification <> 'rejected') AS live,
      bool_or(verification = 'verified') AS verified,
      bool_or(verification IN ('conflicting', 'rejected')) AS disputed
    FROM latest
    WHERE recency = 1
    GROUP BY latest.student_id, latest.person_id
  )
  SELECT candidates.student_id, (min(candidates.person_id::text) FILTER (WHERE verified))::uuid
  FROM candidates
  WHERE live
  GROUP BY candidates.student_id
  HAVING count(*) = 1 AND bool_or(verified) AND NOT bool_or(disputed);
$$;
--> statement-breakpoint
CREATE VIEW public_entry_person_memberships WITH (security_barrier = true) AS
SELECT membership.*
FROM entry_person_memberships membership
JOIN warehouse_public_relationship_evidence eligible USING (evidence_id)
JOIN warehouse_evidence roster ON roster.id = membership.evidence_id
JOIN warehouse_evidence_relationships link ON link.evidence_id = membership.evidence_id
  AND link.entry_id = membership.entry_id
LEFT JOIN public_student_person_assertions identity ON identity.evidence_id = membership.identity_evidence_id
LEFT JOIN public_student_person_as_of(CURRENT_TIMESTAMP) resolved
  ON resolved.student_id = membership.student_id AND resolved.person_id = membership.person_id
WHERE membership.verification = 'verified' AND (
  (membership.student_id IS NULL AND roster.output_role = 'entry-person' AND link.person_id = membership.person_id)
  OR (roster.output_role = 'roster-member' AND link.student_id = membership.student_id
    AND identity.verification = 'verified' AND identity.fetched_at <= CURRENT_TIMESTAMP
    AND resolved.person_id IS NOT NULL)
);
