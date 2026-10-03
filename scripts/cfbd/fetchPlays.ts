import { getPlays, type GetPlaysData, type Play } from 'cfbd';
import { cfbdRequest, runIfMain, saveSample } from '@/lib/cfbd/client';

export function fetchPlays(query: GetPlaysData['query']): Promise<Play[]> {
  return cfbdRequest(() => getPlays({ query }));
}

runIfMain(import.meta.url, async () => {
  const plays = await fetchPlays({ year: 2024, week: 1, team: 'Rice' });
  await saveSample('plays', plays);
});
