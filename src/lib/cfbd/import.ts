import { parseArgs } from 'node:util';
import { validateSeason } from '@/lib/cfbd/client';
import type { ConferenceStandingRow, RiceScheduleRow } from '@/lib/cfbd/db';
import { RICE_TEAM } from '@/lib/cfbd/schedule';
import type { ConferenceStanding, ScheduleGame } from '@/lib/cfbd/types';

/*
 * Imports Rice's CFBD schedule and one conference's standings into Supabase (docs/cfbd.md).
 * Both collections are fetched and validated before anything is written, so a failed fetch or
 * bad data leaves the stored rows untouched (docs/storage-contract.md).
 */

export type ImportScope = {
  season: number;
  /* CFBD abbreviation, trimmed and uppercased, e.g. AAC */
  conference: string;
};

/* What the import needs from outside. The command passes the real functions; tests pass fakes. */
export type ImportDeps = {
  fetchSchedule: (season: number) => Promise<ScheduleGame[]>;
  fetchStandings: (conference: string, season: number) => Promise<ConferenceStanding[]>;
  upsertSchedule: (rows: RiceScheduleRow[]) => Promise<number>;
  upsertStandings: (rows: ConferenceStandingRow[]) => Promise<number>;
  now: () => Date;
  log: (message: string) => void;
};

/* Reads --season and --conference, throwing a readable error with usage before any request is made. */
export function parseScopeArgs(argv: string[], command: string): ImportScope {
  const usage = `Usage: npx tsx --env-file=.env.local ${command} --season <year> --conference <CFBD abbreviation, e.g. AAC>`;

  let values: { season?: string; conference?: string };
  try {
    ({ values } = parseArgs({
      args: argv,
      options: { season: { type: 'string' }, conference: { type: 'string' } },
      allowPositionals: false,
    }));
  } catch (error) {
    throw new Error(`${messageOf(error)}\n${usage}`);
  }

  const seasonText = values.season?.trim() ?? '';
  const conference = values.conference?.trim().toUpperCase() ?? '';
  if (!/^\d{4}$/.test(seasonText)) throw new Error(`--season must be a year like 2026.\n${usage}`);
  if (!/^[A-Z0-9-]{2,20}$/.test(conference)) throw new Error(`--conference must be a CFBD abbreviation like AAC.\n${usage}`);

  const season = Number(seasonText);
  validateSeason(season);
  return { season, conference };
}

/* Fetches and validates both collections, then upserts them. Throws a readable error on any failure. */
export async function runCfbdImport({ season, conference }: ImportScope, deps: ImportDeps): Promise<void> {
  deps.log(`CFBD import: season ${season}, conference ${conference}`);

  let schedule: ScheduleGame[];
  let standings: ConferenceStanding[];
  try {
    [schedule, standings] = await Promise.all([deps.fetchSchedule(season), deps.fetchStandings(conference, season)]);
    validateSchedule(schedule);
    validateStandings(standings);
  } catch (error) {
    throw new Error(`${messageOf(error)} Nothing was written.`);
  }

  // One collection time for the whole scope. It's when we fetched, not a game time or a CFBD update time.
  const fetchedAt = deps.now().toISOString();
  const scheduleRows = toRiceScheduleRows(schedule, season, fetchedAt);
  const standingRows = toConferenceStandingRows(standings, season, conference, fetchedAt);
  deps.log(
    `Collected ${scheduleRows.length} Rice schedule games and ${standingRows.length} ${conference} standings rows (fetched_at ${fetchedAt}).`,
  );

  // Two separate writes, so not atomic: if the second fails, the first has already happened.
  await upsertAll('cfbd_rice_schedule', scheduleRows, deps.upsertSchedule, deps.log, 'Standings were not written.');
  await upsertAll(
    'cfbd_conference_standings',
    standingRows,
    deps.upsertStandings,
    deps.log,
    'cfbd_rice_schedule was already updated, so this import is incomplete.',
  );
  deps.log('Import complete.');
}

/* Throws one error listing every problem with the schedule, so a single run reports them all. */
export function validateSchedule(games: ScheduleGame[]): void {
  const problems: string[] = games.length === 0 ? ['no games returned'] : [];
  const seen = new Set<string>();

  games.forEach((game, index) => {
    const label = isText(game.gameId) ? `game ${game.gameId}` : `game #${index + 1}`;
    const check = (ok: boolean, problem: string) => {
      if (!ok) problems.push(`${label} ${problem}`);
    };

    check(isText(game.gameId), 'has a blank game ID');
    check(isCount(game.week), 'week is not a whole number of 0 or more');
    check(isText(game.opponent), 'has a blank opponent');
    check(game.homeAway === 'home' || game.homeAway === 'away', 'home/away is not "home" or "away"');
    check(isTimestamp(game.date), 'date is not an ISO timestamp with a time zone');
    check(typeof game.startTimeTbd === 'boolean', 'TBD flag is not true or false');
    check(typeof game.conferenceGame === 'boolean', 'conference-game flag is not true or false');
    check(game.status === 'scheduled' || game.status === 'completed', 'status is not "scheduled" or "completed"');
    check(isScore(game.riceScore), 'Rice score is not empty or a whole number of 0 or more');
    check(isScore(game.opponentScore), 'opponent score is not empty or a whole number of 0 or more');
    if (isText(game.gameId)) {
      check(!seen.has(game.gameId), 'appears more than once');
      seen.add(game.gameId);
    }
  });

  throwIfProblems('Rice schedule', problems);
}

/* Throws one error listing every problem with the standings. Missing counts are errors, never 0. */
export function validateStandings(standings: ConferenceStanding[]): void {
  const problems: string[] = standings.length === 0 ? ['no teams returned'] : [];
  const seen = new Set<string>();

  standings.forEach((row, index) => {
    const label = isText(row.team) ? `team ${row.team}` : `team #${index + 1}`;
    const check = (ok: boolean, problem: string) => {
      if (!ok) problems.push(`${label} ${problem}`);
    };

    check(isText(row.team), 'has a blank name');
    check(isCount(row.conferenceWins), 'conference wins is not a whole number of 0 or more');
    check(isCount(row.conferenceLosses), 'conference losses is not a whole number of 0 or more');
    check(isCount(row.overallWins), 'overall wins is not a whole number of 0 or more');
    check(isCount(row.overallLosses), 'overall losses is not a whole number of 0 or more');
    if (isText(row.team)) {
      check(!seen.has(row.team), 'appears more than once');
      seen.add(row.team);
    }
  });

  throwIfProblems('standings', problems);
}

export function toRiceScheduleRows(games: ScheduleGame[], season: number, fetchedAt: string): RiceScheduleRow[] {
  return games.map((game) => ({
    season,
    rice_team_id: RICE_TEAM.cfbdId,
    game_id: game.gameId,
    week: game.week,
    opponent: game.opponent,
    home_away: game.homeAway,
    game_date: game.date,
    start_time_tbd: game.startTimeTbd,
    conference_game: game.conferenceGame,
    status: game.status,
    rice_score: game.riceScore,
    opponent_score: game.opponentScore,
    fetched_at: fetchedAt,
  }));
}

export function toConferenceStandingRows(
  standings: ConferenceStanding[],
  season: number,
  conference: string,
  fetchedAt: string,
): ConferenceStandingRow[] {
  return standings.map((row) => ({
    season,
    conference,
    team: row.team,
    conference_wins: row.conferenceWins,
    conference_losses: row.conferenceLosses,
    overall_wins: row.overallWins,
    overall_losses: row.overallLosses,
    fetched_at: fetchedAt,
  }));
}

async function upsertAll<T>(
  table: string,
  rows: T[],
  upsert: (rows: T[]) => Promise<number>,
  log: (message: string) => void,
  ifFailed: string,
): Promise<void> {
  let upserted: number;
  try {
    upserted = await upsert(rows);
  } catch (error) {
    throw new Error(`Writing ${table} failed: ${messageOf(error)}. ${ifFailed} Rerunning the same command is safe.`);
  }

  if (upserted !== rows.length) {
    throw new Error(
      `Supabase reported ${upserted} rows upserted into ${table}, expected ${rows.length}. ${ifFailed} Rerunning the same command is safe.`,
    );
  }
  log(`Upserted ${upserted} rows into ${table}.`);
}

const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isScore(value: unknown): boolean {
  return value === null || isCount(value);
}

function isTimestamp(value: unknown): boolean {
  return typeof value === 'string' && ISO_TIMESTAMP.test(value) && !Number.isNaN(Date.parse(value));
}

function throwIfProblems(collection: string, problems: string[]): void {
  if (problems.length === 0) return;
  const shown = problems.slice(0, 5).join('; ');
  const more = problems.length > 5 ? `; and ${problems.length - 5} more` : '';
  throw new Error(`Invalid ${collection} from CFBD: ${shown}${more}.`);
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
