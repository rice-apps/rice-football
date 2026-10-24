import { getTeams, type GetTeamsData, type Team } from 'cfbd';
import { cfbdRequest, runIfMain, saveSample } from '@/lib/cfbd/client';

export function fetchTeams(query: GetTeamsData['query'] = {}): Promise<Team[]> {
  return cfbdRequest(() => getTeams({ query }));
}

runIfMain(import.meta.url, async () => {
  const teams = await fetchTeams({ year: 2024 });
  await saveSample('teams', teams);
});
