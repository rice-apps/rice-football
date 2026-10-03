import { getGames, type Game, type GetGamesData } from 'cfbd';
import { cfbdRequest, runIfMain, saveSample } from '@/lib/cfbd/client';

export function fetchGames(query: GetGamesData['query'] = {}): Promise<Game[]> {
  return cfbdRequest(() => getGames({ query }));
}

runIfMain(import.meta.url, async () => {
  const games = await fetchGames({ year: 2024, team: 'Rice' });
  await saveSample('games', games);
});
