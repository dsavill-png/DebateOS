CREATE TABLE judge_analytics_builds (
  id text PRIMARY KEY,
  revision_id uuid NOT NULL REFERENCES season_revisions(id),
  evidence_cutoff timestamptz NOT NULL,
  mapping_version integer NOT NULL CHECK (mapping_version = 1),
  refreshed_at timestamptz NOT NULL DEFAULT transaction_timestamp()
);

CREATE TABLE judge_analytics_active (
  scope_id text PRIMARY KEY REFERENCES season_scopes(id),
  build_id text NOT NULL REFERENCES judge_analytics_builds(id)
);

CREATE TABLE judge_analytics_inputs (
  build_id text NOT NULL REFERENCES judge_analytics_builds(id),
  evidence_id uuid NOT NULL REFERENCES warehouse_evidence(id),
  PRIMARY KEY (build_id, evidence_id)
);
CREATE INDEX judge_analytics_inputs_evidence ON judge_analytics_inputs (evidence_id);

CREATE TABLE judge_assignments_public (
  build_id text NOT NULL REFERENCES judge_analytics_builds(id),
  person_id uuid NOT NULL REFERENCES persons(id),
  panel_id uuid NOT NULL REFERENCES panels(id),
  tournament_id uuid NOT NULL REFERENCES tournaments(id),
  event_id uuid NOT NULL REFERENCES events(id),
  round_id uuid NOT NULL REFERENCES rounds(id),
  verification text NOT NULL CHECK (verification = 'verified'),
  competition_date date,
  tournament_name text,
  event_name text NOT NULL,
  round_label text,
  incomplete_school_coverage boolean NOT NULL,
  unknown_event_assignment_coverage boolean NOT NULL,
  PRIMARY KEY (build_id, person_id, panel_id)
);

CREATE TABLE judge_assignment_sources_public (
  build_id text NOT NULL,
  person_id uuid NOT NULL,
  panel_id uuid NOT NULL,
  judge_id uuid NOT NULL REFERENCES judges(id),
  evidence_id uuid NOT NULL,
  PRIMARY KEY (build_id, person_id, panel_id, judge_id, evidence_id),
  FOREIGN KEY (build_id, person_id, panel_id) REFERENCES judge_assignments_public,
  FOREIGN KEY (build_id, evidence_id) REFERENCES judge_analytics_inputs
);
CREATE INDEX judge_assignment_sources_evidence ON judge_assignment_sources_public (evidence_id);

CREATE TABLE judge_panel_entries_public (
  build_id text NOT NULL REFERENCES judge_analytics_builds(id),
  panel_id uuid NOT NULL REFERENCES panels(id),
  entry_id uuid NOT NULL REFERENCES entries(id),
  school_id uuid REFERENCES schools(id),
  chapter_id uuid REFERENCES chapters(id),
  school_name text,
  explicit_snu boolean NOT NULL,
  PRIMARY KEY (build_id, panel_id, entry_id)
);
CREATE INDEX judge_panel_entries_snu ON judge_panel_entries_public (build_id, panel_id) WHERE explicit_snu;

CREATE TABLE judge_panel_entry_sources_public (
  build_id text NOT NULL,
  panel_id uuid NOT NULL,
  entry_id uuid NOT NULL,
  evidence_id uuid NOT NULL,
  PRIMARY KEY (build_id, panel_id, entry_id, evidence_id),
  FOREIGN KEY (build_id, panel_id, entry_id) REFERENCES judge_panel_entries_public,
  FOREIGN KEY (build_id, evidence_id) REFERENCES judge_analytics_inputs
);
CREATE INDEX judge_panel_entry_sources_evidence ON judge_panel_entry_sources_public (evidence_id);

CREATE TABLE judge_names_public (
  build_id text NOT NULL REFERENCES judge_analytics_builds(id),
  person_id uuid NOT NULL REFERENCES persons(id),
  display_name text NOT NULL,
  PRIMARY KEY (build_id, person_id)
);

CREATE TABLE judge_name_sources_public (
  build_id text NOT NULL,
  person_id uuid NOT NULL,
  evidence_id uuid NOT NULL,
  PRIMARY KEY (build_id, person_id, evidence_id),
  FOREIGN KEY (build_id, person_id) REFERENCES judge_names_public,
  FOREIGN KEY (build_id, evidence_id) REFERENCES judge_analytics_inputs
);
CREATE INDEX judge_name_sources_evidence ON judge_name_sources_public (evidence_id);

-- Cache eligibility is evaluated at read time as well as at build time.
CREATE VIEW judge_analytics_servable AS
SELECT b.*, active.scope_id
FROM judge_analytics_active active JOIN judge_analytics_builds b ON b.id = active.build_id
WHERE NOT EXISTS (
  SELECT FROM judge_analytics_inputs i
  JOIN warehouse_evidence w ON w.id = i.evidence_id
  JOIN warehouse_captures c ON c.id = w.snapshot_id
  LEFT JOIN warehouse_public_evidence e ON e.id = i.evidence_id
  WHERE i.build_id = b.id AND (e.id IS NULL OR w.retention_policy <> 'public-evidence'
    OR c.retention_policy <> 'public-evidence'
    OR CASE WHEN w.output_role = 'season-event-classification'
      THEN w.purpose <> 'season membership evidence' OR c.purpose <> 'season membership evidence'
      ELSE w.purpose <> 'tournament evidence' OR c.purpose NOT IN ('tournament evidence', 'season membership evidence')
    END)
);

CREATE MATERIALIZED VIEW judge_summary_public_cache AS
SELECT active.scope_id, a.build_id, a.person_id, n.display_name,
  count(*) AS observed_debates_judged,
  count(DISTINCT a.tournament_id) AS observed_tournament_count,
  min(a.competition_date) AS first_observed_judging_date,
  max(a.competition_date) AS latest_observed_judging_date,
  1 AS observed_season_count,
  count(*) FILTER (WHERE EXISTS (
    SELECT FROM judge_panel_entries_public pe
    WHERE pe.build_id = a.build_id AND pe.panel_id = a.panel_id AND pe.explicit_snu
  )) AS observed_snu_debate_count,
  count(*) FILTER (WHERE a.competition_date IS NULL) AS assignments_missing_date,
  count(*) FILTER (WHERE a.incomplete_school_coverage) AS assignments_with_incomplete_school_coverage,
  count(DISTINCT a.event_id) FILTER (WHERE a.unknown_event_assignment_coverage)
    AS observed_events_with_unknown_assignment_coverage,
  b.evidence_cutoff, b.refreshed_at
FROM judge_analytics_active active
JOIN judge_analytics_builds b ON b.id = active.build_id
JOIN judge_assignments_public a ON a.build_id = b.id
LEFT JOIN judge_names_public n ON (n.build_id, n.person_id) = (a.build_id, a.person_id)
GROUP BY active.scope_id, a.build_id, a.person_id, n.display_name, b.evidence_cutoff, b.refreshed_at;

CREATE UNIQUE INDEX judge_summary_public_cache_scope_person ON judge_summary_public_cache (scope_id, person_id);
CREATE INDEX judge_summary_public_cache_person ON judge_summary_public_cache (person_id);

CREATE VIEW judge_summary_public AS
SELECT summary.* FROM judge_summary_public_cache summary
JOIN judge_analytics_servable b ON b.id = summary.build_id AND b.scope_id = summary.scope_id;

CREATE VIEW judge_snu_detail_public AS
SELECT b.scope_id, a.*, n.display_name, person.person_source_id, t.tournament_source_id,
  event.event_source_id, r.round_source_id, p.panel_source_id, b.evidence_cutoff, b.refreshed_at,
  panel_entries.entries, assignment_sources.scoped_judge_ids
FROM judge_analytics_servable b
JOIN judge_assignments_public a ON a.build_id = b.id
JOIN persons person ON person.id = a.person_id
JOIN tournaments t ON t.id = a.tournament_id
JOIN events event ON event.id = a.event_id
JOIN rounds r ON r.id = a.round_id
JOIN panels p ON p.id = a.panel_id
LEFT JOIN judge_names_public n ON (n.build_id, n.person_id) = (a.build_id, a.person_id)
JOIN LATERAL (
  SELECT jsonb_agg(jsonb_build_object('entry_id', pe.entry_id, 'school_id', pe.school_id,
    'chapter_id', pe.chapter_id, 'school_name', pe.school_name, 'explicit_snu', pe.explicit_snu)
    ORDER BY pe.entry_id) AS entries
  FROM judge_panel_entries_public pe
  WHERE pe.build_id = a.build_id AND pe.panel_id = a.panel_id
  HAVING bool_or(pe.explicit_snu)
) panel_entries ON true
CROSS JOIN LATERAL (
  SELECT array_agg(DISTINCT j.judge_source_id ORDER BY j.judge_source_id) AS scoped_judge_ids
  FROM judge_assignment_sources_public s JOIN judges j ON j.id = s.judge_id
  WHERE EXISTS (SELECT FROM warehouse_public_evidence e WHERE e.id = s.evidence_id AND e.output_role = 'panel-judge')
    AND (s.build_id, s.person_id, s.panel_id) = (a.build_id, a.person_id, a.panel_id)
) assignment_sources;

REVOKE ALL ON judge_summary_public_cache, judge_analytics_builds, judge_analytics_active,
  judge_analytics_inputs, judge_assignments_public, judge_assignment_sources_public,
  judge_panel_entries_public, judge_panel_entry_sources_public, judge_names_public,
  judge_name_sources_public, judge_analytics_servable FROM PUBLIC;

CREATE FUNCTION build_public_judge_analytics(
  requested_scope text, requested_revision integer, requested_pin text, cutoff timestamptz
) RETURNS text
LANGUAGE plpgsql
SET search_path FROM CURRENT
AS $$
DECLARE
  revision_key uuid;
  build_key text;
BEGIN
  IF cutoff IS NULL OR NOT isfinite(cutoff) OR requested_pin IS NULL THEN
    RAISE EXCEPTION 'A manifest pin and finite evidence cutoff are required';
  END IF;
  -- Serialize refresh across scopes. Concurrent ingestion is read through the caller's snapshot.
  LOCK TABLE judge_analytics_active IN SHARE ROW EXCLUSIVE MODE;
  SELECT id INTO STRICT revision_key FROM season_revisions
    WHERE scope_id = requested_scope AND version = requested_revision
      AND definition->>'pin' = requested_pin;

  CREATE TEMP TABLE mart_evidence ON COMMIT DROP AS
  SELECT e.*, c.fetched_at, c.request_scope->>'tournament' AS tournament,
    c.request_scope->>'event' AS capture_event, c.request_scope->>'round' AS capture_round,
    c.source_method, c.response_digest
  FROM warehouse_public_evidence e
  JOIN warehouse_evidence w ON w.id = e.id
  JOIN warehouse_captures c ON c.id = e.snapshot_id
  WHERE c.provider = 'tabroom' AND c.status = 200 AND c.fetched_at <= cutoff
    AND w.retention_policy = 'public-evidence' AND c.retention_policy = 'public-evidence'
    AND e.observation_state = 'observed'
    AND e.parser_version IN (1, 2) AND e.verification IN ('observed', 'verified', 'conflicting')
    AND ((e.output_role = 'season-event-classification'
        AND w.purpose = 'season membership evidence' AND c.purpose = 'season membership evidence')
      OR (e.output_role IN ('tournament', 'event', 'round', 'round-competition-date', 'panel',
          'judge', 'judge-person', 'person', 'panel-judge', 'panel-entry', 'entry', 'entry-school',
          'school', 'school-chapter', 'judge-roster-name', 'ballot-judge-name')
        AND w.purpose = 'tournament evidence'
        AND c.purpose IN ('tournament evidence', 'season membership evidence')
        AND c.source_method = 'bulk'
        AND c.route = 'https://www.tabroom.com/api/download_data.mhtml?tourn_id=' || (c.request_scope->>'tournament')));
  CREATE UNIQUE INDEX ON mart_evidence (id);
  CREATE INDEX ON mart_evidence (output_role, subject_id, snapshot_id, parser_version, source_pointer);

  CREATE TEMP TABLE mart_memberships ON COMMIT DROP AS
  SELECT m.event_id, e.id AS evidence_id, event.tournament_source_id AS tournament,
    e.observed_value->>'name' AS division
  FROM season_memberships m
  JOIN season_membership_evidence me ON me.membership_id = m.id
  JOIN mart_evidence e ON e.id = me.evidence_id
  JOIN events event ON event.id = m.event_id AND event.provider = 'tabroom'
  WHERE m.revision_id = revision_key AND m.decision = 'included'
    AND e.output_role = 'season-event-classification' AND e.verification = 'observed'
    AND e.subject_id = event.id AND e.tournament = event.tournament_source_id
    AND e.raw_source_id #>> '{}' = event.event_source_id
    AND e.observed_value->>'name' = m.classification->>'division'
    AND e.observed_value->>'type' = m.classification->>'sourceType';

  CREATE TEMP TABLE mart_panels ON COMMIT DROP AS
  SELECT DISTINCT event.id AS event_id, r.id AS round_id, p.id AS panel_id, t.id AS tournament_id,
    t.tournament_source_id AS tournament, m.division, m.evidence_id AS membership_evidence,
    event_row.id AS event_evidence, round_row.id AS round_evidence, panel_row.id AS panel_evidence,
    panel_row.snapshot_id, panel_row.parser_version, panel_row.source_pointer, panel_row.fetched_at,
    coalesce(round_row.observed_value->>'label', round_row.observed_value->>'name') AS round_label
  FROM mart_memberships m
  JOIN events event ON event.id = m.event_id
  JOIN tournaments t ON (t.provider, t.tournament_source_id) = (event.provider, event.tournament_source_id)
  JOIN rounds r ON (r.provider, r.tournament_source_id, r.event_source_id) =
    (event.provider, event.tournament_source_id, event.event_source_id)
  JOIN panels p ON (p.provider, p.tournament_source_id, p.event_source_id, p.round_source_id) =
    (r.provider, r.tournament_source_id, r.event_source_id, r.round_source_id)
  JOIN mart_evidence panel_row ON panel_row.subject_id = p.id AND panel_row.output_role = 'panel'
    AND panel_row.tournament = t.tournament_source_id
    AND (panel_row.capture_event IS NULL OR panel_row.capture_event = event.event_source_id)
    AND (panel_row.capture_round IS NULL OR panel_row.capture_round = r.round_source_id)
  JOIN mart_evidence round_row ON round_row.subject_id = r.id AND round_row.output_role = 'round'
    AND (round_row.snapshot_id, round_row.parser_version) = (panel_row.snapshot_id, panel_row.parser_version)
    AND split_part(panel_row.source_pointer, '/sections/', 1) = round_row.source_pointer
  JOIN mart_evidence event_row ON event_row.subject_id = event.id AND event_row.output_role = 'event'
    AND (event_row.snapshot_id, event_row.parser_version) = (panel_row.snapshot_id, panel_row.parser_version)
    AND split_part(round_row.source_pointer, '/rounds/', 1) = event_row.source_pointer;

  CREATE INDEX ON mart_panels (snapshot_id, parser_version, panel_id);
  CREATE TEMP TABLE mart_scoped_judges ON COMMIT DROP AS
  SELECT p.*, j.id AS judge_id, pj.id AS assignment_evidence, ji.id AS judge_evidence,
    pj.source_pointer AS ballot_pointer
  FROM mart_panels p
  JOIN mart_evidence pj ON pj.subject_id = p.panel_id AND pj.output_role = 'panel-judge'
    AND (pj.snapshot_id, pj.parser_version) = (p.snapshot_id, p.parser_version)
    AND split_part(pj.source_pointer, '/ballots/', 1) = p.source_pointer
  JOIN warehouse_evidence_relationships rel ON rel.evidence_id = pj.id AND rel.panel_id = p.panel_id
  JOIN panel_judges canonical ON canonical.panel_id = p.panel_id AND canonical.judge_id = rel.judge_id
  JOIN judges j ON j.id = rel.judge_id AND j.provider = 'tabroom'
    AND j.tournament_source_id = p.tournament AND pj.raw_source_id #>> '{}' = j.judge_source_id
  JOIN mart_evidence ji ON ji.subject_id = j.id AND ji.output_role = 'judge'
    AND (ji.snapshot_id, ji.parser_version, ji.source_pointer) = (pj.snapshot_id, pj.parser_version, pj.source_pointer);

  CREATE INDEX ON mart_scoped_judges (panel_id);
  CREATE INDEX ON mart_panels (event_id);
  CREATE TEMP TABLE mart_person_links ON COMMIT DROP AS
  SELECT DISTINCT j.judge_id, person.id AS person_id, jp.id AS link_evidence, pi.id AS person_evidence,
    jp.fetched_at, jp.snapshot_id, jp.parser_version, jp.source_pointer, jp.verification
  FROM mart_scoped_judges j
  JOIN mart_evidence jp ON jp.subject_id = j.judge_id AND jp.output_role = 'judge-person'
    AND (jp.snapshot_id, jp.parser_version, jp.source_pointer) = (j.snapshot_id, j.parser_version, j.ballot_pointer)
    AND jp.verification IN ('verified', 'conflicting')
  JOIN warehouse_evidence_relationships rel ON rel.evidence_id = jp.id AND rel.judge_id = j.judge_id
  JOIN persons person ON person.id = rel.person_id AND person.provider = 'tabroom'
    AND person.person_source_id = jp.raw_source_id #>> '{}'
  JOIN mart_evidence pi ON pi.subject_id = person.id AND pi.output_role = 'person'
    AND (pi.snapshot_id, pi.parser_version, pi.source_pointer) = (jp.snapshot_id, jp.parser_version, jp.source_pointer);

  -- Resolve contradictions after filtering visibility. Parser conflict flags can describe
  -- other observations in the original batch, so only eligible assertions enter this check.
  CREATE INDEX ON mart_person_links (judge_id, person_id, snapshot_id, parser_version);
  CREATE TEMP TABLE mart_resolved_person ON COMMIT DROP AS
  SELECT judge_id, min(person_id::text)::uuid AS person_id
  FROM mart_person_links GROUP BY judge_id HAVING count(DISTINCT person_id) = 1;

  CREATE TEMP TABLE mart_assignments ON COMMIT DROP AS
  SELECT DISTINCT j.*, person.person_id
  FROM mart_scoped_judges j JOIN mart_resolved_person person USING (judge_id);

  CREATE TEMP TABLE mart_entry_observations ON COMMIT DROP AS
  SELECT DISTINCT p.panel_id, entry.id AS entry_id, pe.id AS panel_entry_evidence, en.id AS entry_evidence,
    es.id AS entry_school_evidence, school.id AS school_id, sn.id AS school_evidence,
    sn.observed_value->>'name' AS school_name, chapter.id AS chapter_id, sc.id AS chapter_evidence, p.fetched_at
  FROM mart_panels p
  JOIN mart_evidence pe ON pe.subject_id = p.panel_id AND pe.output_role = 'panel-entry'
    AND (pe.snapshot_id, pe.parser_version) = (p.snapshot_id, p.parser_version)
    AND split_part(pe.source_pointer, '/ballots/', 1) = p.source_pointer
  JOIN warehouse_evidence_relationships panel_link ON panel_link.evidence_id = pe.id AND panel_link.panel_id = p.panel_id
  JOIN events event ON event.id = p.event_id
  LEFT JOIN entries entry ON entry.id = panel_link.entry_id
    AND (entry.provider, entry.tournament_source_id, entry.event_source_id) =
      (event.provider, event.tournament_source_id, event.event_source_id)
    AND pe.raw_source_id #>> '{}' = entry.entry_source_id
  LEFT JOIN mart_evidence en ON en.subject_id = entry.id AND en.output_role = 'entry'
    AND (en.snapshot_id, en.parser_version) = (p.snapshot_id, p.parser_version)
  LEFT JOIN mart_evidence es ON es.subject_id = en.subject_id AND es.output_role = 'entry-school'
    AND (es.snapshot_id, es.parser_version, es.source_pointer) = (en.snapshot_id, en.parser_version, en.source_pointer)
  LEFT JOIN warehouse_evidence_relationships school_link ON school_link.evidence_id = es.id AND school_link.entry_id = entry.id
  LEFT JOIN schools school ON school.id = school_link.school_id AND school.provider = event.provider
    AND school.tournament_source_id = p.tournament
  LEFT JOIN mart_evidence sn ON sn.subject_id = school.id AND sn.output_role = 'school'
    AND (sn.snapshot_id, sn.parser_version) = (es.snapshot_id, es.parser_version)
    AND split_part(en.source_pointer, '/entries/', 1) = sn.source_pointer
  LEFT JOIN mart_evidence sc ON sc.subject_id = sn.subject_id AND sc.output_role = 'school-chapter'
    AND (sc.snapshot_id, sc.parser_version, sc.source_pointer) = (sn.snapshot_id, sn.parser_version, sn.source_pointer)
  LEFT JOIN warehouse_evidence_relationships chapter_link ON chapter_link.evidence_id = sc.id AND chapter_link.school_id = school.id
  LEFT JOIN chapters chapter ON chapter.id = chapter_link.chapter_id AND chapter.provider = event.provider
    AND chapter.chapter_source_id = sc.raw_source_id #>> '{}';

  CREATE INDEX ON mart_entry_observations (panel_id, entry_id);
  CREATE TEMP TABLE mart_effective_entries ON COMMIT DROP AS
  SELECT panel_id, entry_id,
    CASE WHEN count(DISTINCT school_id) = 1 AND bool_and(school_evidence IS NOT NULL)
      THEN min(school_id::text)::uuid END AS school_id,
    CASE WHEN count(DISTINCT school_id) = 1 AND bool_and(school_evidence IS NOT NULL)
      AND count(DISTINCT chapter_id) = 1 AND bool_and(chapter_id IS NOT NULL)
      THEN min(chapter_id::text)::uuid END AS chapter_id,
    CASE WHEN count(DISTINCT school_id) = 1 AND bool_and(school_evidence IS NOT NULL)
      AND count(DISTINCT school_name) = 1 AND bool_and(school_name IS NOT NULL)
      THEN min(school_name) END AS school_name
  FROM (
    SELECT *, dense_rank() OVER (PARTITION BY panel_id, entry_id ORDER BY fetched_at DESC) AS recency
    FROM mart_entry_observations WHERE entry_id IS NOT NULL AND entry_evidence IS NOT NULL
  ) observations WHERE recency = 1
  GROUP BY panel_id, entry_id;

  CREATE TEMP TABLE mart_context ON COMMIT DROP AS
  SELECT p.*, d.id AS date_evidence, d.observed_value #>> '{}' AS date_value,
    t.id AS tournament_evidence, t.observed_value->>'name' AS tournament_name
  FROM mart_panels p
  JOIN mart_evidence r ON r.id = p.round_evidence
  LEFT JOIN mart_evidence d ON d.subject_id = r.subject_id AND d.output_role = 'round-competition-date'
    AND d.verification = 'verified' AND (d.observed_value #>> '{}') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    AND pg_input_is_valid(d.observed_value #>> '{}', 'date')
    AND (d.snapshot_id, d.parser_version, d.source_pointer) = (r.snapshot_id, r.parser_version, r.source_pointer || '/start_time')
  LEFT JOIN mart_evidence t ON t.subject_id = p.tournament_id AND t.output_role = 'tournament'
    AND (t.snapshot_id, t.parser_version, t.source_pointer) = (p.snapshot_id, p.parser_version, '');

  CREATE TEMP TABLE mart_effective_context ON COMMIT DROP AS
  SELECT panel_id,
    CASE WHEN count(DISTINCT date_value) = 1 AND bool_and(date_value IS NOT NULL)
      THEN min(date_value)::date END AS competition_date,
    CASE WHEN count(DISTINCT round_label) = 1 THEN min(round_label) END AS round_label,
    CASE WHEN count(DISTINCT tournament_name) = 1 THEN min(tournament_name) END AS tournament_name
  FROM (
    SELECT *, dense_rank() OVER (PARTITION BY panel_id ORDER BY fetched_at DESC) AS recency FROM mart_context
  ) observations WHERE recency = 1 GROUP BY panel_id;

  CREATE TEMP TABLE mart_name_observations ON COMMIT DROP AS
  SELECT DISTINCT link.person_id, roster.id AS evidence_id, link.link_evidence, link.person_evidence,
    roster.observed_value #>> '{}' AS display_name, link.fetched_at
  FROM mart_person_links link
  JOIN mart_resolved_person person USING (judge_id, person_id)
  JOIN mart_evidence roster ON roster.subject_id = link.judge_id AND roster.output_role = 'judge-roster-name'
    AND (roster.snapshot_id, roster.parser_version) = (link.snapshot_id, link.parser_version)
  WHERE jsonb_typeof(roster.observed_value) = 'string'
    AND btrim(roster.observed_value #>> '{}') <> ''
    AND coalesce((
      SELECT bool_or(ballot.observed_value = roster.observed_value)
      FROM mart_person_links same_capture
      JOIN mart_evidence ballot ON ballot.output_role = 'ballot-judge-name' AND ballot.subject_id = same_capture.judge_id
        AND (ballot.snapshot_id, ballot.parser_version, ballot.source_pointer) =
          (same_capture.snapshot_id, same_capture.parser_version, same_capture.source_pointer)
      WHERE (same_capture.judge_id, same_capture.person_id, same_capture.snapshot_id, same_capture.parser_version) =
        (link.judge_id, link.person_id, link.snapshot_id, link.parser_version)
    ), true);

  -- Keep every eligible input that can affect the scope, source reduction or gap
  -- calculations. Build identity also covers the immutable revision and mapping.
  CREATE TEMP TABLE mart_input_ids ON COMMIT DROP AS
  SELECT evidence_id AS id FROM mart_memberships
  UNION SELECT unnest(ARRAY[event_evidence, round_evidence, panel_evidence, date_evidence, tournament_evidence]) FROM mart_context
  UNION SELECT unnest(ARRAY[assignment_evidence, judge_evidence]) FROM mart_scoped_judges
  UNION SELECT unnest(ARRAY[link_evidence, person_evidence]) FROM mart_person_links
  UNION SELECT panel_entry_evidence FROM mart_entry_observations
  UNION SELECT unnest(ARRAY[entry_evidence, entry_school_evidence, school_evidence, chapter_evidence]) FROM mart_entry_observations
  UNION SELECT e.id FROM mart_evidence e JOIN mart_person_links link
    ON (e.snapshot_id, e.parser_version, e.subject_id) = (link.snapshot_id, link.parser_version, link.judge_id)
    AND (e.output_role = 'judge-roster-name' OR
      (e.output_role = 'ballot-judge-name' AND e.source_pointer = link.source_pointer));

  SELECT encode(sha256(convert_to(jsonb_build_array(revision_key, requested_pin, extract(epoch FROM cutoff), 1,
    'public-evidence-v1', coalesce(jsonb_agg(jsonb_build_array(e.id, e.response_digest) ORDER BY e.id), '[]'))::text,
    'UTF8')), 'hex')
  INTO build_key FROM mart_input_ids i JOIN mart_evidence e ON e.id = i.id;

  IF NOT EXISTS (SELECT FROM judge_analytics_builds WHERE id = build_key) THEN
    INSERT INTO judge_analytics_builds (id, revision_id, evidence_cutoff, mapping_version)
      VALUES (build_key, revision_key, cutoff, 1);
    INSERT INTO judge_analytics_inputs SELECT build_key, id FROM mart_input_ids WHERE id IS NOT NULL;

    INSERT INTO judge_panel_entries_public
    SELECT build_key, panel_id, entry_id, school_id, chapter_id, school_name,
      coalesce(lower(btrim(school_name)) = 'southern nazarene university', false)
        AND (SELECT count(*) FROM mart_effective_entries other WHERE other.panel_id = entry.panel_id) <= 2
        AND NOT EXISTS (SELECT FROM mart_entry_observations unresolved
          WHERE unresolved.panel_id = entry.panel_id AND unresolved.entry_id IS NULL)
    FROM mart_effective_entries entry;

    INSERT INTO judge_panel_entry_sources_public
    SELECT DISTINCT build_key, pe.panel_id, pe.entry_id, lineage.id
    FROM judge_panel_entries_public pe JOIN mart_entry_observations observed USING (panel_id, entry_id)
    CROSS JOIN LATERAL unnest(ARRAY[observed.panel_entry_evidence, observed.entry_evidence,
      observed.entry_school_evidence, observed.school_evidence, observed.chapter_evidence]) lineage(id)
    WHERE pe.build_id = build_key AND lineage.id IS NOT NULL;

    INSERT INTO judge_assignments_public
    SELECT DISTINCT build_key, a.person_id, a.panel_id, a.tournament_id, a.event_id, a.round_id,
      'verified', context.competition_date, context.tournament_name, a.division, context.round_label,
      (SELECT count(*) <> 2 OR count(entry.school_name) <> 2
       FROM judge_panel_entries_public entry WHERE entry.build_id = build_key AND entry.panel_id = a.panel_id)
      OR EXISTS (SELECT FROM mart_entry_observations entry WHERE entry.panel_id = a.panel_id
        AND (entry.entry_id IS NULL OR entry.entry_evidence IS NULL)),
      EXISTS (
        SELECT FROM mart_panels panel WHERE panel.event_id = a.event_id
          AND NOT EXISTS (SELECT FROM mart_scoped_judges judge WHERE judge.panel_id = panel.panel_id)
      )
    FROM mart_assignments a JOIN mart_effective_context context USING (panel_id);

    INSERT INTO judge_assignment_sources_public
    SELECT DISTINCT build_key, a.person_id, a.panel_id, a.judge_id, lineage.id
    FROM mart_assignments a
    JOIN mart_person_links person USING (judge_id, person_id)
    JOIN mart_context context USING (panel_id)
    CROSS JOIN LATERAL unnest(ARRAY[a.assignment_evidence, a.judge_evidence, person.link_evidence,
      person.person_evidence, context.event_evidence, context.round_evidence, context.panel_evidence,
      context.membership_evidence, context.date_evidence, context.tournament_evidence]) lineage(id)
    WHERE lineage.id IS NOT NULL;

    INSERT INTO judge_names_public
    SELECT build_key, person_id, min(display_name)
    FROM (
      SELECT *, dense_rank() OVER (PARTITION BY person_id ORDER BY fetched_at DESC) AS recency
      FROM mart_name_observations
    ) candidates WHERE recency = 1
    GROUP BY person_id HAVING count(DISTINCT display_name) = 1;

    INSERT INTO judge_name_sources_public
    SELECT DISTINCT build_key, n.person_id, lineage.id
    FROM judge_names_public n
    JOIN (
      SELECT *, dense_rank() OVER (PARTITION BY person_id ORDER BY fetched_at DESC) AS recency
      FROM mart_name_observations
    ) observation USING (person_id)
    CROSS JOIN LATERAL unnest(ARRAY[observation.evidence_id, observation.link_evidence, observation.person_evidence]) lineage(id)
    WHERE n.build_id = build_key AND observation.recency = 1 AND observation.display_name = n.display_name;
  END IF;

  INSERT INTO judge_analytics_active VALUES (requested_scope, build_key)
    ON CONFLICT (scope_id) DO UPDATE SET build_id = EXCLUDED.build_id;
  REFRESH MATERIALIZED VIEW judge_summary_public_cache;
  DROP TABLE mart_input_ids, mart_name_observations, mart_effective_context, mart_context,
    mart_effective_entries, mart_entry_observations, mart_assignments, mart_resolved_person,
    mart_person_links, mart_scoped_judges, mart_panels, mart_memberships, mart_evidence;
  RETURN build_key;
END;
$$;

REVOKE ALL ON FUNCTION build_public_judge_analytics(text, integer, text, timestamptz) FROM PUBLIC;
