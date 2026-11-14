import { listReports } from "@/lib/reports/db";
import { reportErrorResponse } from "@/lib/reports/routeErrors";

// Staff report library. GET lists stored metadata for static reports only, newest first.
// The kind filter is part of the database query, so runnable reports are never sent to staff.
//
// No user authorization yet: this is a fictional-data development workflow.

export async function GET() {
  try {
    return Response.json(await listReports({ kind: "static" }));
  } catch (error) {
    return reportErrorResponse(error, "Couldn't load reports. Please try again.");
  }
}
