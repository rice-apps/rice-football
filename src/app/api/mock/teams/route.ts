const teams = [
  { id: "rice", name: "Rice", mascot: "Owls"},
  { id: "houston", name: "Houston", mascot: "Cougars"},
  { id: "texas", name: "Texas", mascot: "Longhorns"}
  { id: "ut", name: "UT", mascot: "Vols"},
];

export async function GET() {
  return Response.json(teams);
}
