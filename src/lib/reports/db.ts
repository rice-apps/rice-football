import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { REPORT_COLUMNS, toReport, toReportInsert, type ReportRow } from "@/lib/reports/mapping";
import type { NewReport } from "@/lib/reports/validation";
import type { Report, ReportKind } from "@/types/report";

// Reads and writes report metadata in the Supabase `reports` table. This must only run on the
// server: it uses the secret key, which bypasses Row Level Security. The table grants nothing to
// the publishable key, so the browser cannot read or write it directly.
//
// Callers are NOT authorized here. Until report auth is connected, store fictional metadata only.

/**
 * Explicit development cap on how many reports one listing returns. There is no paging yet, so a
 * listing that hits the cap says so (`truncated`) instead of silently dropping older reports.
 */
export const REPORT_LIST_LIMIT = 200;

export type ReportList = {
  reports: Report[];
  /** True when more reports exist than the cap allows; only the newest are included. */
  truncated: boolean;
  limit: number;
};

/** Thrown when the Supabase environment variables are missing, so routes can explain the setup problem. */
export class ReportConfigError extends Error {
  constructor() {
    super("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required (see .env.example)");
    this.name = "ReportConfigError";
  }
}

let supabase: SupabaseClient | undefined;

// Created on first use, so a missing key fails the request rather than the build.
function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    if (!url || !secretKey) throw new ReportConfigError();
    // The server has no user sessions to store or refresh.
    supabase = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return supabase;
}

/**
 * Stored report metadata, newest first. Pass a kind to filter in the database query itself:
 * staff listings must request "static" so runnable reports never leave the server.
 */
export async function listReports(filter: { kind?: ReportKind } = {}): Promise<ReportList> {
  let query = getSupabase().from("reports").select(REPORT_COLUMNS);
  if (filter.kind) query = query.eq("kind", filter.kind);

  // Ask for one row past the cap to learn whether anything was left out.
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(REPORT_LIST_LIMIT + 1)
    .overrideTypes<ReportRow[], { merge: false }>();

  if (error) throw new Error(`Failed to list reports: ${error.message}`);
  return {
    reports: data.slice(0, REPORT_LIST_LIMIT).map(toReport),
    truncated: data.length > REPORT_LIST_LIMIT,
    limit: REPORT_LIST_LIMIT,
  };
}

/**
 * Saves validated metadata and returns it as stored, with the database-generated id and
 * timestamps. No file is stored and the record has no file URL. Not idempotent: retrying after
 * an unclear failure can create a second record with the same name.
 */
export async function createReport(report: NewReport): Promise<Report> {
  const { data, error } = await getSupabase()
    .from("reports")
    .insert(toReportInsert(report))
    .select(REPORT_COLUMNS)
    .single()
    .overrideTypes<ReportRow, { merge: false }>();

  if (error) throw new Error(`Failed to create report: ${error.message}`);
  return toReport(data);
}
