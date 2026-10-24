import { players } from "@/data/mock/players";

export async function GET() {
  return Response.json(players);
}
