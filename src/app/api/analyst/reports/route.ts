import { createReport, listReports } from "@/lib/reports/db";
import { reportErrorResponse } from "@/lib/reports/routeErrors";
import { validateNewReport } from "@/lib/reports/validation";

// Analyst report library. GET lists all stored metadata (static and runnable), newest first;
// POST saves validated metadata for a new report. Only metadata is saved: no file is uploaded,
// and a new record has no file URL.
//
// No user authorization yet: this is a fictional-data development workflow.

export async function GET() {
  try {
    return Response.json(await listReports());
  } catch (error) {
    return reportErrorResponse(error, "Couldn't load reports. Please try again.");
  }
}

export async function POST(request: Request) {
  // Invalid JSON becomes undefined, which the validator rejects.
  const body: unknown = await request.json().catch(() => undefined);
  const result = validateNewReport(body);
  if (!result.ok) {
    return Response.json({ error: result.error, fieldErrors: result.fieldErrors }, { status: 400 });
  }

  try {
    return Response.json({ report: await createReport(result.value) }, { status: 201 });
  } catch (error) {
    return reportErrorResponse(error, "Couldn't save the report. Please try again.");
  }
}
