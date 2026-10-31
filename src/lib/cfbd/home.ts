import type { ScheduleGame as HomeGame, StandingsRow } from '@/data/mock/home';
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
