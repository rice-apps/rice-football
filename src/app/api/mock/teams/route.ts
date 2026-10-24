import { teams } from "@/data/mock/teams";

export async function GET() {
  return Response.json(teams);
}
