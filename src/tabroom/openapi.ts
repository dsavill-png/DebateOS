// Task 001 approved public GET operations from the pinned Tabroom spec.
// See docs/research/001-tabroom-ingestion-contract-v1.md.
const origin = 'https://api.tabroom.com';
const basePath = '/v1';

export const spec = {
  version: '1.2.0',
  sha256: 'e01682f296589c599f6390127ef06a6c9fb10f8c6ab3019a700727322bd7e375',
} as const;

const publicGetPaths = {
  tournament: '/rest/tourns/{tournId}',
  invite: '/rest/tourns/{tournId}/invite',
} as const;

export const protectedRestResources = ['rounds', 'results', 'schedule'] as const;

export function publicRestUrls(tournamentId: string) {
  return {
    tournament: origin + basePath + publicGetPaths.tournament.replace('{tournId}', tournamentId),
    invite: origin + basePath + publicGetPaths.invite.replace('{tournId}', tournamentId),
  };
}
