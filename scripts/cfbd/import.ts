import { client } from 'cfbd';
import { configureCfbdClient } from '@/lib/cfbd/client';
import { upsertConferenceStandings, upsertRiceSchedule } from '@/lib/cfbd/db';
import { parseScopeArgs, runCfbdImport } from '@/lib/cfbd/import';
import { getRiceSchedule } from '@/lib/cfbd/schedule';
import { getConferenceStandings } from '@/lib/cfbd/standings';

/*
 * Imports Rice's CFBD schedule and one conference's standings into Supabase (docs/cfbd.md):
 *   npx tsx --env-file=.env.local scripts/cfbd/import.ts --season 2026 --conference AAC
 * Exits with a nonzero status on any failure.
 */

const CFBD_TIMEOUT_MS = 30_000;

async function main(): Promise<void> {
  const scope = parseScopeArgs(process.argv.slice(2), 'scripts/cfbd/import.ts');

  // Give up on any CFBD request after 30 seconds. Set here rather than in client.ts so the
  // homepage's CFBD requests don't change.
  configureCfbdClient();
  client.setConfig({ fetch: (request) => fetch(request, { signal: AbortSignal.timeout(CFBD_TIMEOUT_MS) }) });

  await runCfbdImport(scope, {
    fetchSchedule: getRiceSchedule,
    fetchStandings: getConferenceStandings,
    upsertSchedule: upsertRiceSchedule,
    upsertStandings: upsertConferenceStandings,
    now: () => new Date(),
    log: (message) => console.log(message),
  });
}

main().catch((error: unknown) => {
  console.error(`CFBD import failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
