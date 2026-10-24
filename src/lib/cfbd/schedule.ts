import { getGames, type Game } from 'cfbd';
import { cfbdRequest, runIfMain, saveSample, validateSeason } from '@/lib/cfbd/client';
import type { ScheduleGame } from '@/lib/cfbd/types';

/**
* Rice's identity in CFBD appears to be based off of ESPN team IDs and as such is unlikely to change, but not guaranteed.
* We need the ID as a source of truth to tell which side (home or away) Rice is on
* The logic fail loudly if an update does happen to the these constants and responses start disagreeing
*/
export const RICE_TEAM = {
  cfbdId: 242,
  cfbdName: 'Rice',
} as const;

/* Returns Rice's regular season and postseason games for a season, in date order */
export async function getRiceSchedule(season: number): Promise<ScheduleGame[]> {
  validateSeason(season);

  const games = await cfbdRequest(() =>
    getGames({ query: { year: season, team: RICE_TEAM.cfbdName, seasonType: 'both' } }), // 'both' means regular and postseason
  );

  // CFBD returns an empty array instead of an error when nothing matches, so we need to throw explicitly
  if (games.length === 0) {
    throw new Error(`CFBD returned no games for ${RICE_TEAM.cfbdName} in ${season}`);
  }

  // Needs to be sorted here since getGames does not guarantee ordering
  return games.map(toScheduleGame).sort((a, b) => a.date.localeCompare(b.date));
}

/* Converts a raw CFBD game into a ScheduleGame */
function toScheduleGame(game: Game): ScheduleGame {
  let isHome: boolean;

  if (game.homeId === RICE_TEAM.cfbdId) {
    isHome = true;
  } else if (game.awayId === RICE_TEAM.cfbdId) {
    isHome = false;
  } else {
    throw new Error(
      `CFBD game ${game.id} (${game.awayTeam} @ ${game.homeTeam}) doesn't include Rice's ID ` +
      `${RICE_TEAM.cfbdId}. Rice's CFBD ID may have changed; check RICE_TEAM in src/lib/cfbd/schedule.ts`,
    );
  }

  // Normalize raw CFBD data to the application facing type
  return {
    gameId: String(game.id),
    week: game.week,
    opponent: isHome ? game.awayTeam : game.homeTeam,
    homeAway: isHome ? 'home' : 'away',
    date: game.startDate,
    status: game.completed ? 'completed' : 'scheduled',
    riceScore: (isHome ? game.homePoints : game.awayPoints) ?? null,
    opponentScore: (isHome ? game.awayPoints : game.homePoints) ?? null,
  };
}

runIfMain(import.meta.url, async () => {
  const schedule = await getRiceSchedule(2026);
  await saveSample('rice-schedule', schedule);
});
