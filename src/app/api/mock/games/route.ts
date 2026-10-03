// Hardcoded for now so this route works on its own.
// Swap in the shared data from src/data/mock/ once that lands.

const games = [
  { id: "game-1", homeTeamId: "rice", awayTeamId: "houston", season: 2026, week: 1, homeScore: 24, awayScore: 17 },
  { id: "game-2", homeTeamId: "texas", awayTeamId: "rice", season: 2026, week: 2, homeScore: 31, awayScore: 28 },
  { id: "game-3", homeTeamId: "rice", awayTeamId: "team", season: 2026, week: 3, homeScore: 42, awayScore: 3 },
];

export async function GET() {
  return Response.json(games);
}
