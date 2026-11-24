import type profiles from '../../../docs/coverage/college-policy-2025-26-r1-judge-profiles.json';
import type coverage from '../../../docs/coverage/public-judge-profile-field-coverage.json';
import { assignmentDateLabel, judgeCardSummary } from './judge-card-summary';
import styles from './judge-proof.module.css';

type Profile = (typeof profiles)[number];
type FieldCoverage = typeof coverage;
type Evidence = Profile['recentPanels'][number]['evidence'][number];

function EvidenceReference({ reference }: { reference: Evidence }) {
  return <code>{reference.snapshotId} · {reference.pointer}</code>;
}

export function JudgeCard({ profile, fieldCoverage }: { profile: Profile; fieldCoverage: FieldCoverage }) {
  const { identity, atAGlance, coverage, recentPanels } = profile;
  const summary = judgeCardSummary(profile);
  const heading = `judge-${identity.personId}`;
  const verified = identity.displayName.status === 'verified';

  return (
    <article className={styles.card} aria-labelledby={heading}>
      <h2 id={heading}>{identity.displayName.label}</h2>
      <p className={styles.secondary}>Tabroom person {identity.personId}</p>
      <p className={summary.snuRounds ? styles.highlight : styles.exposure}>
        <strong>{summary.snuPanels}</strong>{summary.snuRounds && ` ${summary.snuRounds}`}
      </p>
      <dl className={styles.facts}>
        <div><dt>Observed panels judged</dt><dd>{atAGlance.panelAssignmentCount}</dd></div>
        <div><dt>Observed tournaments</dt><dd>{atAGlance.tournamentCount}</dd></div>
        <div><dt>Observed date span</dt><dd>{summary.dateSpan}</dd></div>
        <div><dt>Divisions judged</dt><dd>{atAGlance.divisions.join(', ')}</dd></div>
      </dl>
      <p className={styles.secondary}>Public records · Partial career coverage</p>
      {summary.hasRosterGap && (
        <p className={styles.gap}>Included-division roster gap{verified && ' · Identity verified'}</p>
      )}
      <details>
        <summary>Recent activity</summary>
        {atAGlance.assignmentsWithoutDate > 0 && (
          <p>Panels with unknown assignment dates: {atAGlance.assignmentsWithoutDate}</p>
        )}
        <ul className={styles.panels}>
          {recentPanels.slice(0, 3).map(panel => (
            <li key={JSON.stringify([panel.tournamentId, panel.eventId, panel.roundId, panel.panelId])}>
              <h3>{panel.tournamentName ?? 'Unknown tournament'}</h3>
              <p>{panel.eventName && panel.eventName !== panel.division && `${panel.eventName} · `}{panel.division}</p>
              <p>Assignment date: {assignmentDateLabel(panel.assignmentDate)}</p>
              <p>Schools observed: {panel.schools.join(', ') || 'Unknown'}</p>
              {panel.schoolCoverageUnresolved && <p>School coverage unresolved</p>}
              <p className={styles.secondary}>Round {panel.roundId} · Panel {panel.panelId}</p>
            </li>
          ))}
        </ul>
        <details>
          <summary>Evidence and data quality</summary>
          <p>Identity status: {identity.displayName.status}</p>
          <p>Evidence cutoff: <time dateTime={fieldCoverage.evidenceCutoff}>{fieldCoverage.evidenceCutoff}</time></p>
          <p>{coverage.caveat} A count of 0 means the included records contain no observations. Activity may exist outside those records.</p>
          {coverage.events.some(event => event.assignmentCoverageUnknown) && <p>Assignment coverage is unknown for some included events.</p>}
          {summary.hasRosterGap && (
            <p>Assigned judge IDs missing from included-division rosters: {coverage.assignedJudgeIdsAbsentFromSeasonRosters}</p>
          )}
          {coverage.panelsWithUnresolvedSchoolCoverage > 0 && (
            <p>Panels with unresolved school coverage: {coverage.panelsWithUnresolvedSchoolCoverage}</p>
          )}
          <h3>Public identity evidence</h3>
          <p>The named roster row and same-capture ballots share a tournament-scoped judge ID. The ballots explicitly link that judge ID to the Tabroom person.</p>
          <ul>
            {identity.displayName.evidence?.map(join => (
              <li key={`${join.rosterEvidence.snapshotId}:${join.rosterEvidence.pointer}`}>
                <p><a href={join.sourceUrl}>Public export for tournament {join.tournamentId}</a> · Judge ID {join.judgeId}</p>
                <p>Roster row <EvidenceReference reference={join.rosterEvidence} /></p>
                <p>Ballot identity references</p>
                <ul>
                  {join.ballotEvidence.map(ref => (
                    <li key={`${ref.snapshotId}:${ref.pointer}`}><EvidenceReference reference={ref} /></li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <h3>Recent panel references</h3>
          <ul>
            {recentPanels.slice(0, 3).map(panel => (
              <li key={JSON.stringify([panel.tournamentId, panel.eventId, panel.roundId, panel.panelId])}>
                Round {panel.roundId} · Panel {panel.panelId}
                <ul>
                  {panel.evidence.map((ref, index) => (
                    <li key={index}><EvidenceReference reference={ref} /></li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </details>
      </details>
    </article>
  );
}
