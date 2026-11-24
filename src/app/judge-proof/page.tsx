import profiles from '../../../docs/coverage/college-policy-2025-26-r1-judge-profiles.json';
import coverage from '../../../docs/coverage/public-judge-profile-field-coverage.json';
import { JudgeCard } from './judge-card';
import styles from './judge-proof.module.css';

export const metadata = { title: 'Judge cards | DebateOS' };
export const dynamic = 'force-static';

export default function JudgeProofPage() {
  return (
    <main className={styles.page}>
      <h1>Judge cards</h1>
      <p>2025–26 college policy · Observed public records</p>
      <div className={styles.cards}>
        {profiles.map(profile => (
          <JudgeCard key={profile.identity.personId} profile={profile} fieldCoverage={coverage} />
        ))}
      </div>
    </main>
  );
}
