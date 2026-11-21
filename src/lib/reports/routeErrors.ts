import "server-only";
import { ReportConfigError } from "@/lib/reports/db";

// Turns a failure from the reports database helpers into a readable JSON response. The details
// are logged on the server only; the browser gets a message that is safe to show.

export function reportErrorResponse(error: unknown, fallbackMessage: string): Response {
  console.error(error);
  if (error instanceof ReportConfigError) {
    return Response.json(
      { error: "Report storage isn't configured on this server. Ask a developer to set the Supabase environment variables." },
      { status: 503 },
    );
  }
  return Response.json({ error: fallbackMessage }, { status: 500 });
}
