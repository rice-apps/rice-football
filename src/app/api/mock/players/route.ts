
const players = [
  { id: "leoz", name: "Leo Zhou", teamId: "rice" }  
  { id: "ntrdrgz", name: "Nathalia Reodurges", teamId: "rice" },
  { id: "jdoe", name: "John Doe", teamId: "houston" },
];

export async function GET() {
  return Response.json(players);
}

