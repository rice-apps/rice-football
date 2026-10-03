// Hardcoded for now so this route works on its own.
// Swap in the shared data from src/data/mock/ once that lands.

const plays = [
  { id: "play-1", gameId: "game-1", offenseTeamId: "rice", defenseTeamId: "houston", down: 1, distance: 10, yardsGained: 6, description: "run up the middle, things happen" },
  { id: "play-2", gameId: "game-1", offenseTeamId: "rice", defenseTeamId: "houston", down: 2, distance: 4, yardsGained: 15, description: "pass over the middle, stuffs" },
  { id: "play-3", gameId: "game-2", offenseTeamId: "texas", defenseTeamId: "rice", down: 3, distance: 7, yardsGained: -2, description: "sacked, woops" },
  { id: "play-4", gameId: "game-2", offenseTeamId: "rice", defenseTeamId: "texas", down: 1, distance: 10, yardsGained: 0, description: "fumble, woops" },
  { id: "play-5", gameId: "game-3", offenseTeamId: "team", defenseTeamId: "rice", down: 4, distance: 1, yardsGained: 1, description: "QB sneak, wowwzers" },
];

export async function GET() {
  return Response.json(plays);
}
