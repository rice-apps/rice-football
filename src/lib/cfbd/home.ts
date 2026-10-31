import {
  conferenceStandings as mockStandings,
  riceSchedule as mockSchedule,
  type ScheduleGame as HomeGame,
  type StandingsRow,
} from '@/data/mock/home';
import { getRiceSchedule } from '@/lib/cfbd/schedule';
import { getConferenceStandings } from '@/lib/cfbd/standings';
import type { ConferenceStanding, ScheduleGame } from '@/lib/cfbd/types';

/*
 * Converts CFBD data into the shapes the homepage components use.
 */

/* Matches the homepage's team id format, e.g. "North Texas" -> "north-texas" */
function toTeamId(team: string): string {
  return team.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export function toHomeSchedule(games: ScheduleGame[]): HomeGame[] {
  return games.map((game) => ({
    id: game.gameId,
    week: game.week,
    kickoff: game.date,
    kickoffTbd: game.startTimeTbd,
    opponentId: toTeamId(game.opponent),
    opponent: game.opponent,
    isHome: game.homeAway === 'home',
    isConference: game.conferenceGame,
    // Homepage treats a game as played only when it has a result
    result:
      game.status === 'completed' && game.riceScore !== null && game.opponentScore !== null
        ? { riceScore: game.riceScore, opponentScore: game.opponentScore }
        : undefined,
  }));
}

export function toHomeStandings(standings: ConferenceStanding[]): StandingsRow[] {
  return standings.map((row) => ({
    teamId: toTeamId(row.team),
    team: row.team,
    conference: { wins: row.conferenceWins, losses: row.conferenceLosses },
    overall: { wins: row.overallWins, losses: row.overallLosses },
  }));
}

/* CFBD's abbreviation for Rice's conference (the full name returns nothing, see standings.ts) */
export const RICE_CONFERENCE = 'AAC';

/* Where a homepage section's data came from */
export type SectionSource = 'cfbd' | 'mock' | 'unavailable';

export type HomeSection<T> = {
  data: T[];
  source: SectionSource;
};

export type HomeData = {
  season: number;
  schedule: HomeSection<HomeGame>;
  standings: HomeSection<StandingsRow>;
};

// Mock data is only for local development; in production a failed section shows as unavailable
const ALLOW_MOCK = process.env.NODE_ENV !== 'production';

/* A season runs Aug-Jan, so January and February still belong to the previous year's season */
export function currentSeason(now: Date = new Date()): number {
  return now.getMonth() < 2 ? now.getFullYear() - 1 : now.getFullYear();
}

/* Loads homepage data from CFBD. Each section handles its own failure */
export async function getHomeData(season: number = currentSeason()): Promise<HomeData> {
  // allSettled waits for both requests, so one failing doesn't take down the other section
  const [schedule, standings] = await Promise.allSettled([
    getRiceSchedule(season).then(toHomeSchedule),
    getConferenceStandings(RICE_CONFERENCE, season).then(toHomeStandings),
  ]);

  return {
    season,
    schedule: toSection(schedule, mockSchedule, 'schedule'),
    standings: toSection(standings, mockStandings, 'standings'),
  };
}

/* Uses the CFBD data if the request succeeded, otherwise mock data (development) or nothing (production) */
function toSection<T>(result: PromiseSettledResult<T[]>, mock: T[], name: string): HomeSection<T> {
  if (result.status === 'fulfilled') {
    return { data: result.value, source: 'cfbd' };
  }

  console.error(`Homepage ${name} failed to load from CFBD:`, result.reason);
  return ALLOW_MOCK ? { data: mock, source: 'mock' } : { data: [], source: 'unavailable' };
}
