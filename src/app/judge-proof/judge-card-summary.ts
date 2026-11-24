import type { JudgeProfile } from '../../warehouse/judge-profile.ts';

export function judgeCardSummary(profile: Pick<JudgeProfile, 'atAGlance' | 'coverage'>) {
  const { firstAssignmentDate, mostRecentAssignmentDate, snuExposure } = profile.atAGlance;
  const { panelCount, roundCount } = snuExposure;

  return {
    dateSpan: firstAssignmentDate === mostRecentAssignmentDate
      ? assignmentDateLabel(firstAssignmentDate)
      : [firstAssignmentDate, mostRecentAssignmentDate].map(assignmentDateLabel).join(' to '),
    snuPanels: `${panelCount} observed SNU ${panelCount === 1 ? 'panel' : 'panels'}`,
    snuRounds: panelCount > 0 ? `in ${roundCount} ${roundCount === 1 ? 'round' : 'rounds'}` : null,
    hasRosterGap: profile.coverage.assignedJudgeIdsAbsentFromSeasonRosters > 0,
  };
}

export function assignmentDateLabel(date: string | null) {
  return date ?? 'Unknown';
}
