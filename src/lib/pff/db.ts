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
