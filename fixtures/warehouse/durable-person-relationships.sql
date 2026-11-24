DO $fixture$
DECLARE
  a uuid;
  b uuid;
  c uuid;
  chapter_a uuid;
  chapter_b uuid;
  student_a uuid;
  student_transfer uuid;
  student_unresolved uuid;
  student_private uuid;
  student_b uuid;
  student_c uuid;
  judge_a uuid;
  entry_ids uuid[];
  roster_students uuid[];
  roster_people uuid[];
  identity_ids uuid[];
  source_ids uuid[];
  protected_source uuid;
  i integer;
BEGIN
  INSERT INTO tournaments (provider, tournament_source_id) VALUES ('synthetic-017', '1');
  INSERT INTO schools (provider, tournament_source_id, school_source_id)
    VALUES ('synthetic-017', '1', 'A'), ('synthetic-017', '1', 'B');
  INSERT INTO events (provider, tournament_source_id, event_source_id) VALUES ('synthetic-017', '1', 'policy');
  INSERT INTO entries (provider, tournament_source_id, event_source_id, entry_source_id)
    SELECT 'synthetic-017', '1', 'policy', n::text FROM generate_series(1, 3) n;
  SELECT array_agg(id ORDER BY entry_source_id) INTO entry_ids FROM entries WHERE provider = 'synthetic-017';
  INSERT INTO chapters (provider, chapter_source_id) VALUES ('synthetic-017', 'A') RETURNING id INTO chapter_a;
  INSERT INTO chapters (provider, chapter_source_id) VALUES ('synthetic-017', 'B') RETURNING id INTO chapter_b;
  INSERT INTO persons (provider, person_source_id) VALUES ('synthetic-017', 'A') RETURNING id INTO a;
  INSERT INTO persons (provider, person_source_id) VALUES ('synthetic-017', 'B') RETURNING id INTO b;
  INSERT INTO persons (provider, person_source_id) VALUES ('synthetic-017', 'C') RETURNING id INTO c;
  INSERT INTO judges (provider, tournament_source_id, judge_source_id)
    VALUES ('synthetic-017', '1', '1') RETURNING id INTO judge_a;
  INSERT INTO students (provider, tournament_source_id, school_source_id, student_source_id)
    VALUES ('synthetic-017', '1', 'A', '1') RETURNING id INTO student_a;
  INSERT INTO students (provider, tournament_source_id, school_source_id, student_source_id)
    VALUES ('synthetic-017', '1', 'B', '1') RETURNING id INTO student_transfer;
  INSERT INTO students (provider, tournament_source_id, school_source_id, student_source_id)
    VALUES ('synthetic-017', '1', 'A', 'unknown') RETURNING id INTO student_unresolved;
  INSERT INTO students (provider, tournament_source_id, school_source_id, student_source_id)
    VALUES ('synthetic-017', '1', 'A', 'private') RETURNING id INTO student_private;
  INSERT INTO students (provider, tournament_source_id, school_source_id, student_source_id)
    VALUES ('synthetic-017', '1', 'A', '2') RETURNING id INTO student_b;
  INSERT INTO students (provider, tournament_source_id, school_source_id, student_source_id)
    VALUES ('synthetic-017', '1', 'B', '3') RETURNING id INTO student_c;

  INSERT INTO warehouse_captures (id, provider, source_method, route, request_scope, fetched_at,
    status, media_type, response_digest, metadata, authorization_class, purpose, audience, retention_policy)
  VALUES
    ('synthetic-017-public', 'synthetic-017', 'fixture', '/fixture', '{}', '2024-01-01',
      200, 'application/json', 'synthetic', '{}', 'public', 'test', 'public', 'test'),
    ('synthetic-017-later', 'synthetic-017', 'fixture', '/fixture', '{}', '2025-01-01',
      200, 'application/json', 'synthetic', '{}', 'public', 'test', 'public', 'test'),
    ('synthetic-017-protected', 'synthetic-017', 'fixture', '/fixture', '{}', '2024-01-01',
      200, 'application/json', 'synthetic', '{}', 'protected', 'test', 'internal', 'test');

  INSERT INTO warehouse_evidence (snapshot_id, parser_version, source_pointer, output_role,
    verification, observation_state, authorization_class, purpose, audience, retention_policy)
  SELECT CASE WHEN n = 6 OR n = 18 THEN 'synthetic-017-later'
              WHEN n = 7 THEN 'synthetic-017-protected' ELSE 'synthetic-017-public' END,
    1, '/' || n,
    CASE WHEN n BETWEEN 11 AND 16 OR n = 19 THEN 'roster-member'
         WHEN n = 10 THEN 'judge-person'
         WHEN n IN (6, 7, 8, 9, 17, 18, 21, 22) THEN 'student-person'
         ELSE 'synthetic-assertion' END,
    'verified', 'observed', 'public', 'test', 'public', 'test'
  FROM generate_series(1, 22) n;
  SELECT array_agg(id ORDER BY substring(source_pointer FROM 2)::integer) INTO source_ids
  FROM warehouse_evidence WHERE snapshot_id LIKE 'synthetic-017-%';
  protected_source := source_ids[7];

  INSERT INTO warehouse_evidence_relationships (evidence_id, judge_id, person_id)
    VALUES (source_ids[10], judge_a, a);
  INSERT INTO warehouse_evidence_relationships (evidence_id, person_id, chapter_id, parent_evidence_id)
    VALUES (source_ids[1], a, NULL, NULL), (source_ids[2], a, NULL, NULL), (source_ids[3], a, NULL, NULL),
      (source_ids[20], a, chapter_b, protected_source);
  INSERT INTO warehouse_evidence_relationships (evidence_id, person_id, chapter_id)
    VALUES (source_ids[4], a, chapter_a), (source_ids[5], a, chapter_b);
  INSERT INTO warehouse_evidence_relationships (evidence_id, student_id, person_id)
    VALUES (source_ids[6], student_a, b), (protected_source, student_private, a),
      (source_ids[8], student_a, a), (source_ids[9], student_transfer, a),
      (source_ids[17], student_unresolved, NULL), (source_ids[18], student_a, a),
      (source_ids[21], student_b, b), (source_ids[22], student_c, c);

  -- Replay the identical relationship assertions, including all three rosters.
  FOR replay IN 1..2 LOOP
    INSERT INTO person_role_observations
      (evidence_id, person_id, role, verification, temporal_precision, effective_start, effective_end, observed_on)
    VALUES (source_ids[1], a, 'debater', 'verified', 'exact-interval', '2022-01-01', '2024-06-30', NULL),
      (source_ids[2], a, 'debater', 'verified', 'start-only', '2024-07-01', NULL, '2025-01-01'),
      (source_ids[3], a, 'judge', 'verified', 'event-only', NULL, NULL, '2025-01-01'),
      (source_ids[20], a, 'coach', 'verified', 'unknown', NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;

    INSERT INTO person_institution_affiliations
      (evidence_id, person_id, chapter_id, role, verification, temporal_precision, effective_start, effective_end)
    VALUES (source_ids[4], a, chapter_a, 'debater', 'verified', 'end-only', NULL, '2024-06-30'),
      (source_ids[5], a, chapter_b, 'debater', 'verified', 'unknown', NULL, NULL),
      (source_ids[20], a, chapter_b, NULL, 'verified', 'unknown', NULL, NULL)
    ON CONFLICT DO NOTHING;

    INSERT INTO student_person_evidence (evidence_id, student_id, person_id, basis, verification)
    VALUES (source_ids[8], student_a, a, 'explicit-source', 'verified'),
      (source_ids[9], student_transfer, a, 'explicit-source', 'verified'),
      (source_ids[6], student_a, b, 'validated-crosswalk', 'conflicting'),
      (source_ids[18], student_a, a, 'explicit-source', 'verified'),
      (source_ids[17], student_unresolved, NULL, NULL, 'unverified'),
      (protected_source, student_private, a, 'explicit-source', 'verified'),
      (source_ids[21], student_b, b, 'explicit-source', 'verified'),
      (source_ids[22], student_c, c, 'explicit-source', 'verified')
    ON CONFLICT DO NOTHING;

    roster_students := ARRAY[student_transfer, student_b, student_transfer, student_c, student_transfer, student_b];
    roster_people := ARRAY[a, b, a, c, a, b];
    identity_ids := ARRAY[source_ids[9], source_ids[21], source_ids[9], source_ids[22], source_ids[9], source_ids[21]];
    FOR i IN 1..6 LOOP
      INSERT INTO warehouse_evidence_relationships (evidence_id, entry_id, student_id)
        VALUES (source_ids[i+10], entry_ids[(i+1)/2], roster_students[i]) ON CONFLICT DO NOTHING;
      INSERT INTO entry_person_memberships (evidence_id, entry_id, person_id, student_id, identity_evidence_id, verification)
        VALUES (source_ids[i+10], entry_ids[(i+1)/2], roster_people[i], roster_students[i], identity_ids[i], 'verified')
        ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;

  INSERT INTO warehouse_evidence_relationships (evidence_id, entry_id, student_id)
    VALUES (source_ids[19], entry_ids[1], student_private);
  INSERT INTO entry_person_memberships (evidence_id, entry_id, person_id, student_id, identity_evidence_id, verification)
    VALUES (source_ids[19], entry_ids[1], a, student_private, protected_source, 'verified');

  IF (SELECT count(*) FROM person_role_observations WHERE person_id = a) <> 4
    OR (SELECT count(*) FROM public_person_role_observations WHERE person_id = a) <> 3
    OR (SELECT count(DISTINCT chapter_id) FROM public_person_institution_affiliations WHERE person_id = a) <> 2
    OR (SELECT count(*) FROM public_person_role_observations WHERE person_id = a
      AND ((role = 'judge' AND observed_on = '2025-01-01')
        OR (role = 'debater' AND observed_on = '2025-01-01' AND temporal_precision = 'start-only'))) <> 2
    OR (SELECT count(*) FROM persons WHERE provider = 'synthetic-017' AND person_source_id = 'A') <> 1
    OR NOT EXISTS (SELECT FROM warehouse_evidence_relationships WHERE judge_id = judge_a AND person_id = a)
  THEN RAISE EXCEPTION 'Role, affiliation, judge continuity, or inherited access failed'; END IF;

  IF (SELECT count(*) FROM public_entry_person_memberships WHERE entry_id = ANY(entry_ids)) <> 6
    OR (SELECT count(*) FROM entry_person_memberships WHERE entry_id = ANY(entry_ids)) <> 7
    OR (SELECT array_agg(entry_id ORDER BY entry_id) FROM public_entry_person_memberships WHERE person_id = b)
      IS DISTINCT FROM ARRAY(SELECT unnest(ARRAY[entry_ids[1], entry_ids[3]]) ORDER BY 1)
    OR (SELECT entry_id FROM public_entry_person_memberships WHERE person_id = c) IS DISTINCT FROM entry_ids[2]
  THEN RAISE EXCEPTION 'Partner history, replay, or protected identity filtering failed'; END IF;

  IF (SELECT person_id FROM public_student_person_as_of('2024-07-01') WHERE student_id = student_a)
      IS DISTINCT FROM a
    OR EXISTS (SELECT FROM public_student_person_as_of('2026-01-01')
      WHERE student_id IN (student_a, student_unresolved, student_private))
    OR NOT EXISTS (SELECT FROM students WHERE id = student_unresolved)
    OR (SELECT count(*) FROM public_student_person_assertions WHERE student_id = student_a) <> 3
  THEN RAISE EXCEPTION 'As-of identity, unresolved reference or conflict preservation failed'; END IF;

  BEGIN
    INSERT INTO person_role_observations
      (evidence_id, person_id, role, verification, temporal_precision, effective_start)
    VALUES (source_ids[19], a, 'debater', 'verified', 'unknown', '2024-01-01');
    RAISE EXCEPTION 'Unknown dates accepted a placeholder';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO student_person_evidence (evidence_id, student_id, person_id, basis, verification)
    VALUES (source_ids[19], student_unresolved, a, 'name-match', 'verified');
    RAISE EXCEPTION 'Name-only identity accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO entry_person_memberships (evidence_id, entry_id, person_id, student_id, identity_evidence_id, verification)
    VALUES (source_ids[19], entry_ids[1], b, student_private, protected_source, 'verified');
    RAISE EXCEPTION 'Membership linked to a different identity candidate';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
END;
$fixture$;
