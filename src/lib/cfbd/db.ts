import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/*
 * Writes and reads the cfbd_* tables (docs/storage-contract.md). Uses the secret key, which
 * bypasses Row Level Security, so only scripts and server code may import this. It has its own
 * client because Q&A's (src/lib/questions/db.ts) is server-only, which plain Node scripts can't load.
 */

const REQUEST_TIMEOUT_MS = 30_000;

/* One row of cfbd_rice_schedule. Column names match the table. */
export type RiceScheduleRow = {
  season: number;
  rice_team_id: number;
  game_id: string;
  week: number;
  opponent: string;
  home_away: 'home' | 'away';
  game_date: string;
  start_time_tbd: boolean;
  conference_game: boolean;
  status: 'scheduled' | 'completed';
  rice_score: number | null;
  opponent_score: number | null;
  fetched_at: string;
};

/* One row of cfbd_conference_standings. Column names match the table. */
export type ConferenceStandingRow = {
  season: number;
  conference: string;
  team: string;
  conference_wins: number;
  conference_losses: number;
  overall_wins: number;
  overall_losses: number;
  fetched_at: string;
};

// The tables' primary keys. Upserting on them makes reruns replace rows instead of adding duplicates.
export const SCHEDULE_CONFLICT_KEY = 'season,rice_team_id,game_id';
export const STANDINGS_CONFLICT_KEY = 'season,conference,team';

const SCHEDULE_COLUMNS =
  'season, rice_team_id, game_id, week, opponent, home_away, game_date, start_time_tbd, conference_game, status, rice_score, opponent_score, fetched_at';
const STANDINGS_COLUMNS =
  'season, conference, team, conference_wins, conference_losses, overall_wins, overall_losses, fetched_at';

let supabase: SupabaseClient | undefined;

// Created on first use, so importing this file doesn't require credentials.
function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    if (!url || !secretKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required (see .env.example)');
    }
    supabase = createClient(url, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }) },
    });
  }
  return supabase;
}

/* Upserts on the table's primary key. Returns the number of rows Supabase reports writing. */
export function upsertRiceSchedule(rows: RiceScheduleRow[]): Promise<number> {
  return upsert('cfbd_rice_schedule', rows, SCHEDULE_CONFLICT_KEY);
}

/* Upserts on the table's primary key. Returns the number of rows Supabase reports writing. */
export function upsertConferenceStandings(rows: ConferenceStandingRow[]): Promise<number> {
  return upsert('cfbd_conference_standings', rows, STANDINGS_CONFLICT_KEY);
}

/* Rice's stored schedule for a season, in date order. */
export async function getStoredRiceSchedule(season: number): Promise<RiceScheduleRow[]> {
  const { data, error } = await getSupabase()
    .from('cfbd_rice_schedule')
    .select(SCHEDULE_COLUMNS)
    .eq('season', season)
    .order('game_date')
    .overrideTypes<RiceScheduleRow[], { merge: false }>();

  if (error) throw new Error(`Reading cfbd_rice_schedule failed: ${safeMessage(error)}`);
  return data;
}

/* A conference's stored standings for a season, by team name. Not an official ranking. */
export async function getStoredConferenceStandings(season: number, conference: string): Promise<ConferenceStandingRow[]> {
  const { data, error } = await getSupabase()
    .from('cfbd_conference_standings')
    .select(STANDINGS_COLUMNS)
    .eq('season', season)
    .eq('conference', conference)
    .order('team')
    .overrideTypes<ConferenceStandingRow[], { merge: false }>();

  if (error) throw new Error(`Reading cfbd_conference_standings failed: ${safeMessage(error)}`);
  return data;
}

async function upsert(table: string, rows: object[], onConflict: string): Promise<number> {
  const { error, count } = await getSupabase().from(table).upsert(rows, { onConflict, count: 'exact' });
  if (error) throw new Error(safeMessage(error));
  return count ?? 0;
}

// Code and message only: Postgres error details can include the whole rejected row.
function safeMessage(error: { code?: string; message: string }): string {
  return error.code ? `${error.code} ${error.message}` : error.message;
}
