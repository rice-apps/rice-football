import type { NewReport, ReportFieldErrors } from "@/lib/reports/validation";
import type { Report } from "@/types/report";

// Browser helpers for the reports API (src/app/api/reports and src/app/api/analyst/reports).
// A failed request throws a ReportApiError with the server's message and field errors.

export class ReportApiError extends Error {
  fieldErrors: ReportFieldErrors;

  constructor(message: string, fieldErrors: ReportFieldErrors = {}) {
    super(message);
    this.name = "ReportApiError";
    this.fieldErrors = fieldErrors;
  }
}

/** A listing, newest first. `truncated` means more reports exist than the server's cap of `limit`. */
export type ReportListResponse = {
  reports: Report[];
  truncated: boolean;
  limit: number;
};

/** Static reports only, for the staff library. */
export function fetchStaffReports(): Promise<ReportListResponse> {
  return request<ReportListResponse>("GET", "/api/reports");
}

/** All reports, static and runnable, for the analyst library. */
export function fetchAnalystReports(): Promise<ReportListResponse> {
  return request<ReportListResponse>("GET", "/api/analyst/reports");
}

/** Saves report metadata and returns it as stored, with its database-generated id. */
export async function submitReport(report: NewReport): Promise<Report> {
  const { report: saved } = await request<{ report: Report }>("POST", "/api/analyst/reports", report);
  return saved;
}

/** A message that's safe to show the user for any error thrown by these helpers. */
export function getErrorMessage(error: unknown): string {
  return error instanceof ReportApiError ? error.message : "Something went wrong. Please try again.";
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ReportApiError("Couldn't reach the server. Check your connection and try again.");
  }

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const { error, fieldErrors } = (data ?? {}) as { error?: string; fieldErrors?: ReportFieldErrors };
    throw new ReportApiError(error ?? `Request failed (${response.status}). Please try again.`, fieldErrors);
  }
  return data as T;
}
