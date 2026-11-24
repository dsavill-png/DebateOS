-- Run inside a transaction on an already migrated database.
CREATE FUNCTION pg_temp.mart_assert(ok boolean, reason text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION '%', reason; END IF;
END;
$$;

DO $fixture$
DECLARE
  revision_key uuid;
  event_key uuid;
  round_key uuid;
  panel_key uuid;
  person_key uuid;
  judge_key uuid;
  school_key uuid;
  entry_key uuid;
  evidence_key uuid;
  membership_key uuid;
  tournament_source text;
  capture_key text;
  panel_path text;
  ballot_path text;
  row_number integer;
  subject uuid;
  idx integer;
  flight integer;
  slot integer;
  person_source text;
  judge_source text;
  item record;
BEGIN
  INSERT INTO season_scopes VALUES ('mart-test');
  INSERT INTO season_revisions (scope_id, version, definition, approved_by, reason)
    VALUES ('mart-test', 1, '{"pin":"fixture"}', 'fixture', 'fixture') RETURNING id INTO revision_key;

  FOR idx IN 1..3 LOOP
    tournament_source := 'mart-test-' || idx;
    capture_key := tournament_source || '-bulk';
    INSERT INTO warehouse_captures VALUES (capture_key, 'tabroom', 'bulk',
      'https://www.tabroom.com/api/download_data.mhtml?tourn_id=' || tournament_source,
      jsonb_build_object('tournament', tournament_source), '2025-02-01Z', 200, 'application/json',
      capture_key, '{}', 'public', 'tournament evidence', NULL, 'public', 'public-evidence');
    INSERT INTO warehouse_captures VALUES (tournament_source || '-scope', 'tabroom', 'REST',
      'https://www.tabroom.com/api/invite.mhtml?tourn_id=' || tournament_source,
      jsonb_build_object('tournament', tournament_source), '2025-02-01Z', 200, 'application/json',
      tournament_source || '-scope', '{}', 'public', 'season membership evidence', NULL, 'public', 'public-evidence');
    INSERT INTO tournaments (provider, tournament_source_id) VALUES ('tabroom', tournament_source) RETURNING id INTO subject;
    INSERT INTO events (provider, tournament_source_id, event_source_id)
      VALUES ('tabroom', tournament_source, '1') RETURNING id INTO event_key;
    INSERT INTO rounds (provider, tournament_source_id, event_source_id, round_source_id)
      VALUES ('tabroom', tournament_source, '1', '1') RETURNING id INTO round_key;
    INSERT INTO season_memberships (revision_id, event_id, decision, rationale, classification)
      VALUES (revision_key, event_key, 'included', 'fixture', '{"division":"Open","sourceType":"policy"}')
      RETURNING id INTO membership_key;
    INSERT INTO warehouse_evidence (snapshot_id, parser_version, source_pointer, output_role, subject_id,
      raw_source_id, observed_value, verification, observation_state, authorization_class, purpose, audience, retention_policy)
      VALUES (tournament_source || '-scope', 1, '/events/0', 'season-event-classification', event_key, '1',
        '{"name":"Open","type":"policy"}', 'observed', 'observed', 'public', 'season membership evidence',
        CASE WHEN idx = 3 THEN 'internal' ELSE 'public' END, 'public-evidence') RETURNING id INTO evidence_key;
    INSERT INTO season_membership_evidence VALUES (membership_key, evidence_key);

    INSERT INTO warehouse_evidence (snapshot_id, parser_version, source_pointer, output_role, subject_id,
      observed_value, verification, observation_state, authorization_class, purpose, audience, retention_policy)
    SELECT capture_key, 2, row.pointer, row.role, row.subject, row.value::jsonb,
      row.verification, 'observed', 'public', 'tournament evidence', 'public', 'public-evidence'
    FROM (VALUES
      ('', 'tournament', subject, '{"name":"Fixture Invitational"}', 'observed'),
      ('/events/0', 'event', event_key, '{"name":"Open"}', 'observed'),
      ('/events/0/rounds/0', 'round', round_key, '{"label":"Round 1"}', 'observed'),
      ('/events/0/rounds/0/start_time', 'round-competition-date', round_key,
        CASE WHEN idx = 1 THEN '"2025-01-01"' END, 'verified')
    ) row(pointer, role, subject, value, verification) WHERE row.value IS NOT NULL;

    FOR flight IN 1..CASE WHEN idx = 1 THEN 2 ELSE 1 END LOOP
      INSERT INTO panels (provider, tournament_source_id, event_source_id, round_source_id, panel_source_id)
        VALUES ('tabroom', tournament_source, '1', '1', flight::text) RETURNING id INTO panel_key;
      panel_path := '/events/0/rounds/0/sections/' || flight;
      INSERT INTO warehouse_evidence (snapshot_id, parser_version, source_pointer, output_role, subject_id,
        verification, observation_state, authorization_class, purpose, audience, retention_policy)
      VALUES (capture_key, 2, panel_path, 'panel', panel_key, 'observed', 'observed',
        'public', 'tournament evidence', 'public', 'public-evidence');

      FOR slot IN 1..2 LOOP
        INSERT INTO entries (provider, tournament_source_id, event_source_id, entry_source_id)
          VALUES ('tabroom', tournament_source, '1', (flight * 10 + slot)::text) RETURNING id INTO entry_key;
        INSERT INTO schools (provider, tournament_source_id, school_source_id)
          VALUES ('tabroom', tournament_source, (flight * 10 + slot)::text) RETURNING id INTO school_key;
        INSERT INTO warehouse_evidence (snapshot_id, parser_version, source_pointer, output_role, subject_id,
          observed_value, verification, observation_state, authorization_class, purpose, audience, retention_policy)
        SELECT capture_key, 2, '/schools/' || (flight * 10 + slot) || row.suffix, row.role, row.subject,
          row.value, 'observed', 'observed', 'public', 'tournament evidence', 'public', 'public-evidence'
        FROM (VALUES
          ('', 'school', school_key, jsonb_build_object('name',
            CASE WHEN idx = 1 AND flight = 1 THEN 'Southern Nazarene University' ELSE 'Fixture University' END)),
          ('/entries/0', 'entry', entry_key, '{}'::jsonb)
        ) row(suffix, role, subject, value);

        IF idx <> 2 OR slot <> 2 THEN
          INSERT INTO warehouse_evidence (snapshot_id, parser_version, source_pointer, output_role, subject_id,
            verification, observation_state, authorization_class, purpose, audience, retention_policy)
          VALUES (capture_key, 2, '/schools/' || (flight * 10 + slot) || '/entries/0', 'entry-school', entry_key,
            'observed', 'observed', 'public', 'tournament evidence', 'public', 'public-evidence') RETURNING id INTO evidence_key;
          INSERT INTO warehouse_evidence_relationships (evidence_id, entry_id, school_id) VALUES (evidence_key, entry_key, school_key);
        END IF;

        FOR row_number IN 1..CASE WHEN idx = 1 AND flight = 1 AND slot = 1 THEN 2 ELSE 1 END LOOP
          person_source := CASE WHEN slot = 2 AND (idx = 2 OR (idx = 1 AND flight = 2)) THEN 'mart-person-no-snu' ELSE 'mart-person-both' END;
          judge_source := CASE WHEN person_source = 'mart-person-no-snu' THEN '3' ELSE row_number::text END;
          INSERT INTO persons (provider, person_source_id) VALUES ('tabroom', person_source)
            ON CONFLICT (provider, person_source_id) DO UPDATE SET person_source_id = EXCLUDED.person_source_id
            RETURNING id INTO person_key;
          INSERT INTO judges (provider, tournament_source_id, judge_source_id) VALUES ('tabroom', tournament_source, judge_source)
            ON CONFLICT (provider, tournament_source_id, judge_source_id) DO UPDATE SET judge_source_id = EXCLUDED.judge_source_id
            RETURNING id INTO judge_key;
          INSERT INTO panel_judges (panel_id, judge_id) VALUES (panel_key, judge_key) ON CONFLICT DO NOTHING;
          ballot_path := panel_path || '/ballots/' || slot || row_number;
          FOR item IN SELECT * FROM (VALUES
            ('panel-entry', panel_key, to_jsonb((flight * 10 + slot)::text)),
            ('panel-judge', panel_key, to_jsonb(judge_source)),
            ('judge', judge_key, to_jsonb(judge_source)),
            ('person', person_key, to_jsonb(person_source)),
            ('judge-person', judge_key, to_jsonb(person_source))
          ) row(role, subject, source) LOOP
            INSERT INTO warehouse_evidence (snapshot_id, parser_version, source_pointer, output_role, subject_id,
              raw_source_id, verification, observation_state, authorization_class, purpose, audience, retention_policy)
            VALUES (capture_key, 2, ballot_path, item.role, item.subject, item.source,
              CASE WHEN item.role = 'judge-person' THEN 'verified' ELSE 'observed' END, 'observed',
              'public', 'tournament evidence', 'public', 'public-evidence') RETURNING id INTO evidence_key;
            IF item.role = 'panel-entry' THEN
              INSERT INTO warehouse_evidence_relationships (evidence_id, panel_id, entry_id) VALUES (evidence_key, panel_key, entry_key);
            ELSIF item.role = 'panel-judge' THEN
              INSERT INTO warehouse_evidence_relationships (evidence_id, panel_id, judge_id) VALUES (evidence_key, panel_key, judge_key);
            ELSIF item.role = 'judge-person' THEN
              INSERT INTO warehouse_evidence_relationships (evidence_id, judge_id, person_id) VALUES (evidence_key, judge_key, person_key);
            END IF;
          END LOOP;
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;
  INSERT INTO panels (provider, tournament_source_id, event_source_id, round_source_id, panel_source_id)
    VALUES ('tabroom', 'mart-test-1', '1', '1', 'empty') RETURNING id INTO panel_key;
  INSERT INTO warehouse_evidence (snapshot_id, parser_version, source_pointer, output_role, subject_id,
    verification, observation_state, authorization_class, purpose, audience, retention_policy)
  VALUES ('mart-test-1-bulk', 2, '/events/0/rounds/0/sections/empty', 'panel', panel_key, 'observed',
    'observed', 'public', 'tournament evidence', 'public', 'public-evidence');

  INSERT INTO warehouse_evidence (snapshot_id, parser_version, source_pointer, output_role, subject_id,
    observed_value, verification, observation_state, authorization_class, purpose, audience, retention_policy)
  SELECT 'mart-test-1-bulk', 2, '/categories/0/judges/0', 'judge-roster-name', id,
    '"Fixture Judge"', 'observed', 'observed', 'public', 'tournament evidence', 'public', 'public-evidence'
  FROM judges WHERE tournament_source_id = 'mart-test-1' AND judge_source_id = '1';
END;
$fixture$;

DO $checks$
DECLARE
  first_build text;
  replacement text;
  first_summary jsonb;
  first_detail jsonb;
  primary_person uuid;
  other_person uuid;
  restricted_panel uuid;
  scoped_judge uuid;
  restricted_assignment uuid;
BEGIN
  SELECT id INTO STRICT primary_person FROM persons WHERE provider = 'tabroom' AND person_source_id = 'mart-person-both';
  SELECT id INTO STRICT other_person FROM persons WHERE provider = 'tabroom' AND person_source_id = 'mart-person-no-snu';
  first_build := build_public_judge_analytics('mart-test', 1, 'fixture', '2025-03-01Z');

  PERFORM pg_temp.mart_assert((SELECT observed_debates_judged = 3 AND observed_tournament_count = 2
    AND observed_snu_debate_count = 1 AND observed_season_count = 1
    AND assignments_missing_date = 1 AND assignments_with_incomplete_school_coverage = 1
    AND observed_events_with_unknown_assignment_coverage = 1
    AND first_observed_judging_date = '2025-01-01' AND latest_observed_judging_date = '2025-01-01'
    AND display_name = 'Fixture Judge'
    FROM judge_summary_public WHERE scope_id = 'mart-test' AND person_id = primary_person), 'unexpected summary');
  PERFORM pg_temp.mart_assert((SELECT observed_snu_debate_count = 0 AND observed_debates_judged = 2 AND observed_tournament_count = 2
    FROM judge_summary_public WHERE scope_id = 'mart-test' AND person_id = other_person),
    'zero observed SNU debates had incorrect grain');
  PERFORM pg_temp.mart_assert((SELECT count(*) = 2 FROM judge_assignments_public
    WHERE build_id = first_build AND person_id = primary_person AND tournament_name = 'Fixture Invitational'
      AND round_id = (SELECT round_id FROM judge_snu_detail_public WHERE build_id = first_build)), 'flighted round lost grain');
  PERFORM pg_temp.mart_assert((SELECT count(*) = 1 AND bool_and(
    jsonb_array_length(entries) = 2 AND scoped_judge_ids = ARRAY['1','2'])
    FROM judge_snu_detail_public WHERE build_id = first_build), 'SNU details lost grain or lineage');
  PERFORM pg_temp.mart_assert((SELECT count(*) = 3 FROM judge_assignment_sources_public s
    JOIN warehouse_evidence e ON e.id = s.evidence_id AND e.output_role = 'panel-judge'
    JOIN judge_snu_detail_public d ON (d.build_id, d.person_id, d.panel_id) = (s.build_id, s.person_id, s.panel_id)
    WHERE s.build_id = first_build), 'duplicate ballot or scoped alias evidence lost');

  SELECT jsonb_agg(to_jsonb(s) ORDER BY person_id) INTO first_summary FROM judge_summary_public s WHERE scope_id = 'mart-test';
  SELECT to_jsonb(d) INTO STRICT first_detail FROM judge_snu_detail_public d WHERE scope_id = 'mart-test';
  -- A later protected correction is attached to a real public round and eligible capture.
  INSERT INTO warehouse_evidence (snapshot_id, parser_version, source_pointer, output_role, subject_id,
    observed_value, verification, observation_state, authorization_class, purpose, audience, retention_policy, grant_scope)
  SELECT 'mart-test-2-bulk', 2, '/events/0/rounds/0/start_time', 'round-competition-date', id,
    '"2025-02-01"', 'verified', 'observed', 'protected', 'tournament evidence', 'internal', 'public-evidence', 'fixture-grant'
  FROM rounds WHERE tournament_source_id = 'mart-test-2';
  SELECT id INTO STRICT restricted_panel FROM panels WHERE tournament_source_id = 'mart-test-1' AND panel_source_id = 'empty';
  SELECT id INTO STRICT scoped_judge FROM judges WHERE tournament_source_id = 'mart-test-1' AND judge_source_id = '1';
  INSERT INTO panel_judges (panel_id, judge_id) VALUES (restricted_panel, scoped_judge);
  INSERT INTO warehouse_evidence (snapshot_id, parser_version, source_pointer, output_role, subject_id,
    raw_source_id, verification, observation_state, authorization_class, purpose, audience, retention_policy)
  VALUES ('mart-test-1-bulk', 2, '/events/0/rounds/0/sections/empty/ballots/0', 'judge', scoped_judge,
    '1', 'observed', 'observed', 'public', 'tournament evidence', 'public', 'public-evidence');
  INSERT INTO warehouse_evidence (snapshot_id, parser_version, source_pointer, output_role, subject_id,
    raw_source_id, verification, observation_state, authorization_class, purpose, audience, retention_policy, grant_scope)
  VALUES ('mart-test-1-bulk', 2, '/events/0/rounds/0/sections/empty/ballots/0', 'panel-judge', restricted_panel,
    '1', 'observed', 'observed', 'protected', 'tournament evidence', 'internal', 'public-evidence', 'fixture-grant')
  RETURNING id INTO restricted_assignment;
  INSERT INTO warehouse_evidence_relationships (evidence_id, panel_id, judge_id)
    VALUES (restricted_assignment, restricted_panel, scoped_judge);
  replacement := build_public_judge_analytics('mart-test', 1, 'fixture', '2025-03-01Z');
  PERFORM pg_temp.mart_assert(replacement = first_build AND
    first_summary = (SELECT jsonb_agg(to_jsonb(s) ORDER BY person_id) FROM judge_summary_public s WHERE scope_id = 'mart-test') AND
    first_detail = (SELECT to_jsonb(d) FROM judge_snu_detail_public d WHERE scope_id = 'mart-test'),
    'protected correction affected inputs, detail, summary or freshness');

  BEGIN
    PERFORM build_public_judge_analytics('mart-test', 1, 'wrong pin', '2025-03-01Z');
    RAISE EXCEPTION 'bad pin accepted';
  EXCEPTION WHEN no_data_found THEN NULL;
  END;
  PERFORM pg_temp.mart_assert((SELECT jsonb_agg(to_jsonb(s) ORDER BY person_id) = first_summary FROM judge_summary_public s WHERE scope_id = 'mart-test'),
    'failed build replaced summary');
  -- A later eligible context observation changes the effective date at the later cutoff.
  INSERT INTO warehouse_captures
  SELECT 'mart-test-2-correction', provider, source_method, route, request_scope, '2025-04-01Z',
    status, media_type, 'correction', metadata, authorization_class, purpose, grant_scope, audience, retention_policy
  FROM warehouse_captures WHERE id = 'mart-test-2-bulk';
  INSERT INTO warehouse_evidence (snapshot_id, parser_version, source_pointer, output_role, subject_id,
    observed_value, verification, observation_state, authorization_class, purpose, audience, retention_policy)
  SELECT 'mart-test-2-correction', parser_version, source_pointer, output_role, subject_id,
    CASE WHEN output_role = 'round-competition-date' THEN '"2025-02-01"'::jsonb ELSE observed_value END,
    verification, observation_state, 'public', purpose, 'public', retention_policy
  FROM warehouse_evidence WHERE snapshot_id = 'mart-test-2-bulk'
    AND output_role IN ('tournament', 'event', 'round', 'panel', 'round-competition-date');
  replacement := build_public_judge_analytics('mart-test', 1, 'fixture', '2025-05-01Z');
  PERFORM pg_temp.mart_assert(replacement <> first_build AND (SELECT latest_observed_judging_date = '2025-02-01'
    AND assignments_missing_date = 0 AND observed_debates_judged = 3
    FROM judge_summary_public WHERE person_id = primary_person AND scope_id = 'mart-test'), 'eligible correction failed');
  PERFORM pg_temp.mart_assert(build_public_judge_analytics('mart-test', 1, 'fixture', '2025-03-01Z') = first_build
    AND EXISTS (SELECT FROM judge_assignments_public WHERE build_id = replacement), 'earlier cutoff or history lost');
  -- Clear the derived partition and recreate its facts from canonical inputs.
  DELETE FROM judge_analytics_active WHERE scope_id = 'mart-test';
  DELETE FROM judge_name_sources_public WHERE build_id = first_build;
  DELETE FROM judge_names_public WHERE build_id = first_build;
  DELETE FROM judge_assignment_sources_public WHERE build_id = first_build;
  DELETE FROM judge_assignments_public WHERE build_id = first_build;
  DELETE FROM judge_panel_entry_sources_public WHERE build_id = first_build;
  DELETE FROM judge_panel_entries_public WHERE build_id = first_build;
  DELETE FROM judge_analytics_inputs WHERE build_id = first_build;
  DELETE FROM judge_analytics_builds WHERE id = first_build;
  PERFORM pg_temp.mart_assert(build_public_judge_analytics('mart-test', 1, 'fixture', '2025-03-01Z') = first_build,
    'full rebuild changed build identity');
  PERFORM pg_temp.mart_assert(first_summary = (SELECT jsonb_agg(to_jsonb(s) ORDER BY person_id)
    FROM judge_summary_public s WHERE scope_id = 'mart-test')
    AND first_detail = (SELECT to_jsonb(d) FROM judge_snu_detail_public d WHERE scope_id = 'mart-test'),
    'full rebuild changed summary or detail');

  UPDATE warehouse_captures SET audience = 'internal' WHERE id = 'mart-test-1-bulk';
  PERFORM pg_temp.mart_assert(NOT EXISTS (SELECT FROM judge_summary_public WHERE scope_id = 'mart-test')
    AND NOT EXISTS (SELECT FROM judge_snu_detail_public WHERE scope_id = 'mart-test'), 'revoked inputs left serving cache visible');
END;
$checks$;
