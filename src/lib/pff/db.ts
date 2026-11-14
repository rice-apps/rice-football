// Node-only: uses the Supabase secret key, so keep this module out of browser components.
import process from "node:process";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { PffFranchise } from "./types";

const COLUMNS = "id,name,league_id,league,sportradar_id";
const SEARCH_LIMIT = 50;

function createSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !secretKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required. Set them in .env.local.");
  }

  try {
    // Scripts have no user sessions to store or refresh.
    return createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not a valid Supabase URL.");
  }
}

function isFranchise(value: unknown): value is PffFranchise {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (
    "id" in value && Number.isSafeInteger(value.id) &&
    "name" in value && typeof value.name === "string" && value.name.trim() !== "" &&
    "league_id" in value && Number.isSafeInteger(value.league_id) &&
    "league" in value && typeof value.league === "string" &&
    "sportradar_id" in value &&
    (value.sportradar_id === null || typeof value.sportradar_id === "string")
  );
}

function toFranchise(row: PffFranchise): PffFranchise {
  return {
    id: row.id,
    name: row.name,
    league_id: row.league_id,
    league: row.league,
    sportradar_id: row.sportradar_id,
  };
}

function failureMessage(action: string, status: number): string {
  if (status === 0) {
    return `${action} failed (network error or timeout).`;
  }

  if (status >= 200 && status < 300) {
    return `${action} returned an unexpected response.`;
  }

  return `${action} failed (HTTP ${status}).`;
}

export async function getPffFranchise(id: number): Promise<PffFranchise | null> {
  if (!Number.isSafeInteger(id)) {
    throw new Error("PFF franchise ID must be a safe integer.");
  }

  const supabase = createSupabase();

  let result;
  try {
    result = await supabase
      .from("pff_franchises")
      .select(COLUMNS)
      .eq("id", id)
      .abortSignal(AbortSignal.timeout(30_000))
      .retry(false)
      .maybeSingle();
  } catch {
    throw new Error("PFF franchise lookup failed (network error or timeout).");
  }

  if (result.error) {
    throw new Error(failureMessage("PFF franchise lookup", result.status));
  }

  const data: unknown = result.data;

  if (data === null) {
    return null;
  }

  if (!isFranchise(data) || data.id !== id) {
    throw new Error("PFF franchise lookup returned an unexpected response.");
  }

  return toFranchise(data);
}

export async function searchPffFranchises(name: string): Promise<PffFranchise[]> {
  const query = typeof name === "string" ? name.trim() : "";

  if (!query) {
    throw new Error("PFF franchise search name must not be blank.");
  }

  // PostgREST ilike also treats * as a wildcard, so use a regex with every metacharacter escaped.
  const literalPattern = query.replace(/[\\^$.|?*+()[\]{}]/g, "\\$&");

  const supabase = createSupabase();

  let result;
  try {
    result = await supabase
      .from("pff_franchises")
      .select(COLUMNS)
      .regexIMatch("name", literalPattern)
      .order("name")
      .order("id")
      .limit(SEARCH_LIMIT)
      .abortSignal(AbortSignal.timeout(30_000))
      .retry(false);
  } catch {
    throw new Error("PFF franchise search failed (network error or timeout).");
  }

  if (result.error) {
    throw new Error(failureMessage("PFF franchise search", result.status));
  }

  const data: unknown = result.data;

  if (!Array.isArray(data) || data.length > SEARCH_LIMIT || !data.every(isFranchise)) {
    throw new Error("PFF franchise search returned an unexpected response.");
  }

  return data.map(toFranchise);
}

export async function upsertPffFranchises(franchises: PffFranchise[]): Promise<number> {
  if (!Array.isArray(franchises) || franchises.length === 0) {
    throw new Error("PFF franchise import needs at least one franchise. No rows were written.");
  }

  if (!franchises.every(isFranchise)) {
    throw new Error("PFF franchise import found an invalid franchise record. No rows were written.");
  }

  const seenIds = new Set<number>();
  for (const franchise of franchises) {
    if (seenIds.has(franchise.id)) {
      throw new Error(`PFF franchise import found duplicate franchise ID ${franchise.id}. No rows were written.`);
    }
    seenIds.add(franchise.id);
  }

  const supabase = createSupabase();

  let countResult;
  try {
    countResult = await supabase
      .from("pff_franchises")
      .select("id", { count: "exact", head: true })
      .abortSignal(AbortSignal.timeout(30_000))
      .retry(false);
  } catch {
    throw new Error("PFF franchise row count failed (network error or timeout). No rows were written.");
  }

  if (countResult.error) {
    throw new Error(`${failureMessage("PFF franchise row count", countResult.status)} No rows were written.`);
  }

  const storedCount = countResult.count;

  if (storedCount === null || !Number.isSafeInteger(storedCount) || storedCount < 0) {
    throw new Error("PFF franchise row count returned an unexpected response. No rows were written.");
  }

  // Catches a shortened vendor response on rerun; it does not prove the first import was complete.
  if (franchises.length < storedCount) {
    throw new Error(
      `PFF returned ${franchises.length} franchises but pff_franchises already has ${storedCount}. No rows were written.`,
    );
  }

  const fetchedAt = new Date().toISOString();
  const rows = franchises.map((franchise) => ({ ...toFranchise(franchise), fetched_at: fetchedAt }));
  const mayHaveWritten = "Some rows may already have been written; rerunning the import is safe.";

  let upsertResult;
  try {
    upsertResult = await supabase
      .from("pff_franchises")
      .upsert(rows, { onConflict: "id", count: "exact" })
      .abortSignal(AbortSignal.timeout(30_000))
      .retry(false);
  } catch {
    throw new Error(`PFF franchise upsert failed (network error or timeout). ${mayHaveWritten}`);
  }

  if (upsertResult.error) {
    throw new Error(`${failureMessage("PFF franchise upsert", upsertResult.status)} ${mayHaveWritten}`);
  }

  if (upsertResult.count !== rows.length) {
    throw new Error(`PFF franchise upsert could not confirm ${rows.length} written rows. ${mayHaveWritten}`);
  }

  return upsertResult.count;
}
