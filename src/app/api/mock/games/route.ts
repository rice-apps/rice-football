import { games } from "@/data/mock/games";

export async function GET() {
  return Response.json(games);
}
