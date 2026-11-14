import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { SCHEDULE_CONFLICT_KEY, STANDINGS_CONFLICT_KEY } from '@/lib/cfbd/db';
import {
  parseScopeArgs,
  runCfbdImport,
  toConferenceStandingRows,
  toRiceScheduleRows,
  validateSchedule,
  validateStandings,
  type ImportDeps,
} from '@/lib/cfbd/import';
import type { ConferenceStanding, ScheduleGame } from '@/lib/cfbd/types';

// Run with: npx tsx --test scripts/cfbd/import.test.ts
// No network or database: CFBD and Supabase are replaced with fakes.

const PLAYED: ScheduleGame = {
  gameId: '401862697',
  week: 1,
  opponent: 'Houston Christian',
  homeAway: 'home',
  date: '2026-09-05T23:00:00.000Z',
  startTimeTbd: false,
  conferenceGame: false,
  status: 'completed',
  riceScore: 31,
  opponentScore: 3,
};

const UPCOMING: ScheduleGame = {
  gameId: '401862821',
  week: 10,
  opponent: 'North Texas',
  homeAway: 'away',
  date: '2026-11-07T05:00:00.000Z',
  startTimeTbd: true,
  conferenceGame: true,
  status: 'scheduled',
  riceScore: null,
  opponentScore: null,
};

const RICE: ConferenceStanding = { team: 'Rice', conferenceWins: 0, conferenceLosses: 3, overallWins: 1, overallLosses: 6 };
const UTSA: ConferenceStanding = { team: 'UTSA', conferenceWins: 3, conferenceLosses: 0, overallWins: 6, overallLosses: 1 };

const FETCHED_AT = '2026-11-14T20:00:00.000Z';

// Real-shaped values that bad vendor data could produce at runtime, despite the TypeScript types.
const withChange = <T>(base: T, change: Record<string, unknown>) => ({ ...base, ...change }) as T;

function fakeDeps(overrides: Partial<ImportDeps> = {}) {
  const calls = { upsertSchedule: 0, upsertStandings: 0 };
  const written: { schedule: unknown[]; standings: unknown[] } = { schedule: [], standings: [] };
  const logs: string[] = [];
  const deps: ImportDeps = {
    fetchSchedule: async () => [PLAYED, UPCOMING],
    fetchStandings: async () => [RICE, UTSA],
    upsertSchedule: async (rows) => {
      calls.upsertSchedule++;
      written.schedule.push(...rows);
      return rows.length;
    },
    upsertStandings: async (rows) => {
      calls.upsertStandings++;
      written.standings.push(...rows);
      return rows.length;
    },
    now: () => new Date(FETCHED_AT),
    log: (message) => logs.push(message),
    ...overrides,
  };
  return { deps, calls, written, logs };
}

test('parses and normalizes the scope flags', () => {
  assert.deepEqual(parseScopeArgs(['--season', '2026', '--conference', ' aac '], 'cmd'), { season: 2026, conference: 'AAC' });
  assert.deepEqual(parseScopeArgs(['--season=2026', '--conference=AAC'], 'cmd'), { season: 2026, conference: 'AAC' });
});

test('rejects missing, malformed, or unknown flags with usage', () => {
  const bad: [string[], RegExp][] = [
    [[], /--season must be a year/],
    [['--season', '2026'], /--conference must be/],
    [['--season', '20x6', '--conference', 'AAC'], /--season must be a year/],
    [['--season', '1800', '--conference', 'AAC'], /Invalid season 1800/],
    [['--season', '2026', '--conference', 'Big 12'], /--conference must be/],
    [['-season', '2026', '-conference', 'AAC'], /Unknown option/],
    [['--season', '2026', '--conference', 'AAC', '--team', 'Rice'], /Unknown option '--team'/],
    [['--season', '2026', '--conference', 'AAC', 'extra'], /positional/i],
  ];
  for (const [argv, message] of bad) {
    assert.throws(() => parseScopeArgs(argv, 'cmd'), message, `argv: ${argv.join(' ')}`);
  }
  assert.throws(() => parseScopeArgs([], 'scripts/cfbd/import.ts'), /Usage: .*scripts\/cfbd\/import\.ts --season/);
});

test('accepts a valid schedule, including unplayed games with no scores', () => {
  assert.doesNotThrow(() => validateSchedule([PLAYED, UPCOMING]));
});

test('rejects each kind of invalid game, naming the game', () => {
  const bad: [Record<string, unknown>, RegExp][] = [
    [{ gameId: ' ' }, /game #1 has a blank game ID/],
    [{ week: -1 }, /week is not a whole number/],
    [{ week: 1.5 }, /week is not a whole number/],
    [{ opponent: '' }, /blank opponent/],
    [{ homeAway: 'neutral' }, /home\/away/],
    [{ date: 'not a date' }, /date is not an ISO timestamp/],
    [{ date: '2026-09-05T23:00:00' }, /date is not an ISO timestamp/],
    [{ startTimeTbd: null }, /TBD flag/],
    [{ conferenceGame: 'yes' }, /conference-game flag/],
    [{ status: 'in progress' }, /status/],
    [{ riceScore: -3 }, /Rice score/],
    [{ riceScore: '31' }, /Rice score/],
    [{ opponentScore: 2.5 }, /opponent score/],
  ];
  for (const [change, message] of bad) {
    assert.throws(() => validateSchedule([withChange(PLAYED, change)]), message, JSON.stringify(change));
  }
  assert.throws(() => validateSchedule([PLAYED, PLAYED]), /game 401862697 appears more than once/);
  assert.throws(() => validateSchedule([]), /no games returned/);
});

test('rejects invalid standings and never treats a missing count as 0', () => {
  assert.doesNotThrow(() => validateStandings([RICE, UTSA]));
  assert.throws(() => validateStandings([withChange(RICE, { conferenceWins: null })]), /team Rice conference wins/);
  assert.throws(() => validateStandings([withChange(RICE, { overallLosses: -1 })]), /overall losses/);
  assert.throws(() => validateStandings([withChange(RICE, { overallWins: 1.5 })]), /overall wins/);
  assert.throws(() => validateStandings([withChange(RICE, { team: '' })]), /team #1 has a blank name/);
  assert.throws(() => validateStandings([RICE, RICE]), /team Rice appears more than once/);
  assert.throws(() => validateStandings([]), /no teams returned/);
});

test('maps games and standings to the table columns, keeping empty scores empty', () => {
  assert.deepEqual(toRiceScheduleRows([UPCOMING], 2026, FETCHED_AT), [
    {
      season: 2026,
      rice_team_id: 242,
      game_id: '401862821',
      week: 10,
      opponent: 'North Texas',
      home_away: 'away',
      game_date: '2026-11-07T05:00:00.000Z',
      start_time_tbd: true,
      conference_game: true,
      status: 'scheduled',
      rice_score: null,
      opponent_score: null,
      fetched_at: FETCHED_AT,
    },
  ]);
  assert.deepEqual(toConferenceStandingRows([RICE], 2026, 'AAC', FETCHED_AT), [
    {
      season: 2026,
      conference: 'AAC',
      team: 'Rice',
      conference_wins: 0,
      conference_losses: 3,
      overall_wins: 1,
      overall_losses: 6,
      fetched_at: FETCHED_AT,
    },
  ]);
});

test('upserts on the storage contract conflict keys', () => {
  assert.equal(SCHEDULE_CONFLICT_KEY, 'season,rice_team_id,game_id');
  assert.equal(STANDINGS_CONFLICT_KEY, 'season,conference,team');
});

test('writes both collections with one fetched_at and logs the counts', async () => {
  const { deps, calls, written, logs } = fakeDeps();
  await runCfbdImport({ season: 2026, conference: 'AAC' }, deps);

  assert.deepEqual(calls, { upsertSchedule: 1, upsertStandings: 1 });
  const rows = [...written.schedule, ...written.standings] as { season: number; fetched_at: string }[];
  assert.equal(rows.length, 4);
  assert.ok(rows.every((row) => row.season === 2026 && row.fetched_at === FETCHED_AT));
  assert.ok(logs.includes(`Collected 2 Rice schedule games and 2 AAC standings rows (fetched_at ${FETCHED_AT}).`));
  assert.ok(logs.includes('Upserted 2 rows into cfbd_rice_schedule.'));
  assert.ok(logs.includes('Upserted 2 rows into cfbd_conference_standings.'));
});

test('a failed schedule or standings fetch writes nothing', async () => {
  for (const failing of ['fetchSchedule', 'fetchStandings'] as const) {
    const { deps, calls } = fakeDeps({
      [failing]: async () => {
        throw new Error('CFBD request failed (503 Service Unavailable)');
      },
    });
    await assert.rejects(runCfbdImport({ season: 2026, conference: 'AAC' }, deps), /503 .*Nothing was written\./);
    assert.deepEqual(calls, { upsertSchedule: 0, upsertStandings: 0 }, failing);
  }
});

test('invalid data writes nothing, even when only one collection is bad', async () => {
  const { deps, calls } = fakeDeps({ fetchStandings: async () => [RICE, withChange(UTSA, { overallWins: null })] });
  await assert.rejects(
    runCfbdImport({ season: 2026, conference: 'AAC' }, deps),
    /Invalid standings from CFBD: team UTSA overall wins .*Nothing was written\./,
  );
  assert.deepEqual(calls, { upsertSchedule: 0, upsertStandings: 0 });
});

test('a failed schedule write stops before the standings', async () => {
  const { deps, calls } = fakeDeps({
    upsertSchedule: async () => {
      throw new Error('42501 permission denied for table cfbd_rice_schedule');
    },
  });
  await assert.rejects(
    runCfbdImport({ season: 2026, conference: 'AAC' }, deps),
    /Writing cfbd_rice_schedule failed: 42501 .*Standings were not written\. Rerunning the same command is safe\./,
  );
  assert.equal(calls.upsertStandings, 0);
});

test('a failed standings write reports that the import is incomplete', async () => {
  const { deps } = fakeDeps({
    upsertStandings: async () => {
      throw new Error('timeout');
    },
  });
  await assert.rejects(
    runCfbdImport({ season: 2026, conference: 'AAC' }, deps),
    /Writing cfbd_conference_standings failed: timeout\. cfbd_rice_schedule was already updated, so this import is incomplete\./,
  );
});

test('fails when Supabase reports fewer rows than were sent', async () => {
  const { deps } = fakeDeps({ upsertSchedule: async () => 1 });
  await assert.rejects(runCfbdImport({ season: 2026, conference: 'AAC' }, deps), /reported 1 rows upserted into cfbd_rice_schedule, expected 2/);
});

// The command itself, run as a subprocess. Both cases fail before any network request.
const root = fileURLToPath(new URL('../../', import.meta.url));
function runCommand(args: string[], env: Record<string, string> = {}) {
  return spawnSync(process.execPath, ['--import', 'tsx', 'scripts/cfbd/import.ts', ...args], {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    timeout: 20_000,
  });
}

test('the command exits 1 with usage when flags are missing', () => {
  const result = runCommand([]);
  assert.ifError(result.error);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /CFBD import failed: --season must be a year like 2026\.\nUsage: /);
});

test('the command exits 1 without a CFBD key', () => {
  const result = runCommand(['--season', '2026', '--conference', 'AAC'], { CFBD_API_KEY: '' });
  assert.ifError(result.error);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr.trim(), 'CFBD import failed: CFBD_API_KEY is required');
});
