import { plays } from "@/data/mock/plays";

export async function GET() {
  return Response.json(plays);
}
