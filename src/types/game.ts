// Mock development type, loosely modeled on CollegeFootballData's Game.
// Not the production schema.
export type Game = {
  id: string;
  season: number;
  week: number;
  seasonType: "regular" | "postseason";
  startDate: string; // date, e.g. "2026-09-05"
  venue: string;
  homeTeamId: string; // references Team.id
  awayTeamId: string; // references Team.id
  homePoints: number;
  awayPoints: number;
};
