import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { downloadTracking, HudlHttpError, hudlRequest } from '../../src/lib/hudl/client';
import type { HudlGame, HudlPage, HudlPlay, HudlPlayer } from '../../src/lib/hudl/types';

const OUTPUT_ROOT = path.join(process.cwd(), 'samples/hudl/raw');
const GAMES_QUERY = `
  query Games($filters: GameFilter!, $limit: Int!, $offset: Int!) {
    games(filters: $filters, limit: $limit, offset: $offset) {
      totalCount items { id name date homeTeam { id name } awayTeam { id name } }
    }
  }`;

function positiveInteger(name: string, fallback?: number): number {
  const raw = process.env[name];
  let value = fallback;

  if (raw !== undefined && raw !== '') {
    value = Number(raw);
  }

  if (value === undefined || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

async function main(): Promise<void> {
  const competitionId = positiveInteger('HUDL_COMPETITION_ID', 1446);
  const seasonId = positiveInteger('HUDL_SEASON_ID', 1052);
  const teamId = positiveInteger('HUDL_TEAM_ID', 1001249);
  const limit = positiveInteger('HUDL_SAMPLE_LIMIT', 5);
  if (limit > 25) {
    throw new Error('HUDL_SAMPLE_LIMIT must be at most 25');
  }
  await mkdir(OUTPUT_ROOT, { recursive: true, mode: 0o700 });
  // A failed rerun must not mix new metadata with an older tracking file.
  const output = await mkdtemp(path.join(OUTPUT_ROOT, 'sample-'));
  console.log(`Sample directory: ${output}`);
  const save = async (name: string, raw: string): Promise<void> => {
    await writeFile(path.join(output, `${name}.json`), raw, { mode: 0o600 });
    console.log(`Saved ${name}.json (${Buffer.byteLength(raw)} bytes)`);
  };

  // GraphQL variables carry the filter values separately from the query text.
  const filters = {
    competitionId,
    seasonId,
    teamIds: [teamId],
  };

  const games = await hudlRequest<{ games: HudlPage<HudlGame> }>(
    GAMES_QUERY,
    { filters, limit, offset: 0 },
  );
  await save('games', games.raw);

  let gameId = games.data.games?.items[0]?.id;
  if (process.env.HUDL_GAME_ID) {
    gameId = positiveInteger('HUDL_GAME_ID');
  }
  if (!gameId) {
    throw new Error('No games matched; check season/team and account access');
  }

  // Fetch a second page to demonstrate the actual offset behavior.
  const nextPage = await hudlRequest<{ games: HudlPage<HudlGame> }>(
    GAMES_QUERY,
    { filters, limit, offset: limit },
  );
  await save('games-next-page', nextPage.raw);

  // Scope the roster to the selected game and team.
  const playerFilters = {
    ...filters,
    gameIds: [gameId],
  };
  const players = await hudlRequest<{ players: HudlPage<HudlPlayer> }>(`
    query Players($filters: PlayerFilter!, $limit: Int!) {
      players(filters: $filters, limit: $limit, offset: 0) {
        totalCount items {
          id name team { id name } mostCommonNumber
          mostCommonPosition { generalPosition }
        }
      }
    }`,
    { filters: playerFilters, limit },
  );
  await save('players', players.raw);

  // A play supplies the temporary URL needed to download its tracking file.
  const playFilters = {
    competitionId,
    gameIds: [gameId],
  };
  const plays = await hudlRequest<{ plays: HudlPage<HudlPlay> }>(`
    query Plays($filters: PlayFilter!, $limit: Int!) {
      plays(filters: $filters, limit: $limit, offset: 0) {
        totalCount items { id name gameIndex game { id } trackingURL }
      }
    }`,
    { filters: playFilters, limit },
  );
  await save('plays', plays.raw);
  if (!plays.data.plays?.items.length) {
    throw new Error('No plays returned for the selected game');
  }

  const attempts: { playId: string; outcome: string }[] = [];
  for (const play of plays.data.plays.items) {
    if (!play.trackingURL) {
      attempts.push({ playId: play.id, outcome: 'No trackingURL' });
      continue;
    }
    let tracking;
    try {
      tracking = await downloadTracking(play.trackingURL);
    } catch (error) {
      if (!(error instanceof HudlHttpError)) {
        throw error;
      }
      if (error.status !== 403 && error.status !== 404) {
        throw error;
      }
      attempts.push({ playId: play.id, outcome: `HTTP ${error.status}` });
      console.warn(`Tracking unavailable for play ${play.id} (HTTP ${error.status}); trying the next sampled play`);
      continue;
    }
    const payload = tracking.data as { tracks?: unknown[] } | null;
    if (!payload || !Array.isArray(payload.tracks) || payload.tracks.length === 0) {
      throw new Error('Tracking response has no tracks; inspect the local response/schema');
    }
    attempts.push({ playId: play.id, outcome: 'Downloaded' });
    await save('tracking', tracking.raw);
    // Save the successful association before returning from this run.
    await save('selection', JSON.stringify({
      fetchedAt: new Date().toISOString(),
      competitionId,
      seasonId,
      teamId,
      gameId,
      playId: play.id,
      limit,
      attempts,
    }, null, 2) + '\n');
    console.log(`Complete: game ${gameId}, play ${play.id}, ${payload.tracks.length} player tracks`);
    return;
  }

  // Reaching here means every sampled play was unavailable. Keep the attempts.
  await save('selection', JSON.stringify({
    fetchedAt: new Date().toISOString(),
    competitionId,
    seasonId,
    teamId,
    gameId,
    limit,
    attempts,
  }, null, 2) + '\n');
  throw new Error('No downloadable tracking in the sampled plays; inspect selection.json and try another HUDL_GAME_ID');
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error('Hudl sample fetch failed');
  }
  process.exitCode = 1;
});
