// Hardcoded for now so this route works on its own.
// Swap in the shared data from src/data/mock/ once that lands.

const players = [
  { id: "leoz", name: "Leo Zhou", teamId: "rice" },
  { id: "ntrdrgz", name: "Nathalia Reodurges", teamId: "rice" },
  { id: "jdoe", name: "John Doe", teamId: "houston" },
];

export async function GET() {
  return Response.json(players);
}

