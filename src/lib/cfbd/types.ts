/*
 * Sanitized types for CFBD data that the rest of the application should use.
 */

/* One game on Rice's schedule, from Rice's POV */
export type ScheduleGame = {
  gameId: string;
  week: number;
  opponent: string;
  homeAway: 'home' | 'away';
  /* ISO timestamp in UTC */
  date: string;
  status: 'scheduled' | 'completed';
  /* null until the game is completed */
  riceScore: number | null;
  opponentScore: number | null;
};

/* One team's row in a conference standings table */
export type ConferenceStanding = {
  team: string;
  conferenceWins: number;
  conferenceLosses: number;
  overallWins: number;
  overallLosses: number;
};
