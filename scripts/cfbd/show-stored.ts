import { getStoredConferenceStandings, getStoredRiceSchedule } from '@/lib/cfbd/db';
import { parseScopeArgs } from '@/lib/cfbd/import';

/*
 * Prints what's stored for one import scope, read from Supabase without calling CFBD:
 *   npx tsx --env-file=.env.local scripts/cfbd/show-stored.ts --season 2026 --conference AAC
 */

async function main(): Promise<void> {
  const { season, conference } = parseScopeArgs(process.argv.slice(2), 'scripts/cfbd/show-stored.ts');
  const [schedule, standings] = await Promise.all([
    getStoredRiceSchedule(season),
    getStoredConferenceStandings(season, conference),
  ]);

  console.log(`cfbd_rice_schedule, season ${season}: ${schedule.length} rows`);
  console.table(
    schedule.map((row) => ({
      week: row.week,
      game_id: row.game_id,
      opponent: row.opponent,
      home_away: row.home_away,
      game_date: row.game_date,
      start_time_tbd: row.start_time_tbd,
      conference_game: row.conference_game,
      status: row.status,
      rice_score: row.rice_score,
      opponent_score: row.opponent_score,
      fetched_at: row.fetched_at,
    })),
  );

  console.log(`cfbd_conference_standings, season ${season}, ${conference}: ${standings.length} rows`);
  console.table(
    standings.map((row) => ({
      team: row.team,
      conference: `${row.conference_wins}-${row.conference_losses}`,
      overall: `${row.overall_wins}-${row.overall_losses}`,
      fetched_at: row.fetched_at,
    })),
  );
}

main().catch((error: unknown) => {
  console.error(`Reading stored CFBD data failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
