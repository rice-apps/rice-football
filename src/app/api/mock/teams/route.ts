// Hardcoded for now so this route works on its own.
// Swap in the shared data from src/data/mock/ once that lands.

const teams = [
  { id: "rice", name: "Rice", mascot: "Owls"},
  { id: "houston", name: "Houston", mascot: "Cougars"},
  { id: "texas", name: "Texas", mascot: "Longhorns"},
  { id: "team", name: "stuffs", mascot: "wowwzers"},
];

export async function GET() {
  return Response.json(teams);
}
