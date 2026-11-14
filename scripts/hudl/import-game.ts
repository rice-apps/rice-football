import { parseArgs } from 'node:util';
import { createClient } from '@supabase/supabase-js';
import { hudlRequest } from '../../src/lib/hudl/client';
import {
  GAME_CONFLICT_COLUMNS,
  importHudlGame,
  ROSTER_CONFLICT_COLUMNS,
  type HudlImportScope,
} from '../../src/lib/hudl/import';
import type { HudlGame, HudlPage, HudlPlayer } from '../../src/lib/hudl/types';

const GAMES_QUERY = `
  query Games($filters: GameFilter!, $limit: Int!, $offset: Int!) {
    games(filters: $filters, limit: $limit, offset: $offset) {
      totalCount items { id name date homeTeam { id name } awayTeam { id name } }
    }
  }`;

const PLAYERS_QUERY = `
  query Players($filters: PlayerFilter!, $limit: Int!, $offset: Int!) {
    players(filters: $filters, limit: $limit, offset: $offset) {
      totalCount items {
        id name team { id name } mostCommonNumber
        mostCommonPosition { generalPosition }
      }
    }
  }`;

const DB_TIMEOUT_MS = 30_000;

function positiveInteger(name: string, raw: string | undefined): number {
  const value = Number(raw);
  if (raw === undefined || raw.trim() === '' || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`--${name} must be a positive integer`);
  }
  return value;
}

function parseScope(): HudlImportScope {
  const { values } = parseArgs({
    options: {
      'competition-id': { type: 'string' },
      'season-id': { type: 'string' },
      'team-id': { type: 'string' },
      'game-id': { type: 'string' },
    },
    strict: true,
  });
  return {
    competitionId: positiveInteger('competition-id', values['competition-id']),
    seasonId: positiveInteger('season-id', values['season-id']),
    teamId: positiveInteger('team-id', values['team-id']),
    gameId: positiveInteger('game-id', values['game-id']),
  };
}

function createDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required; load .env.local');
  }
  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Bound every database request, keeping any signal supabase-js passes in.
    global: {
      fetch: (input, init) => {
        const timeout = AbortSignal.timeout(DB_TIMEOUT_MS);
        return fetch(input, { ...init, signal: init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout });
      },
    },
  });
}

// Report the code and message only; never the payload or credentials.
function databaseError(operation: string, error: { code?: string; message?: string }): Error {
  return new Error(`${operation} failed (${error.code ?? 'no code'}): ${error.message ?? 'unknown error'}`);
}

async function main(): Promise<void> {
  const scope = parseScope();
  const db = createDatabase();
  console.log(
    `Hudl import: competition ${scope.competitionId}, season ${scope.seasonId}, team ${scope.teamId}, game ${scope.gameId}`,
  );

  const scopeFilters = {
    competitionId: scope.competitionId,
    seasonId: scope.seasonId,
    teamIds: [scope.teamId],
  };

  const { game, roster, gamesScanned } = await importHudlGame({
    scope,
    fetchGamesPage: async (offset, limit) => {
      const result = await hudlRequest<{ games: HudlPage<HudlGame> }>(
        GAMES_QUERY,
        { filters: scopeFilters, limit, offset },
      );
      return result.data.games;
    },
    fetchPlayersPage: async (offset, limit) => {
      const result = await hudlRequest<{ players: HudlPage<HudlPlayer> }>(
        PLAYERS_QUERY,
        { filters: { ...scopeFilters, gameIds: [scope.gameId] }, limit, offset },
      );
      return result.data.players;
    },
    writeGame: async (row) => {
      const { error } = await db.from('hudl_games').upsert(row, { onConflict: GAME_CONFLICT_COLUMNS });
      if (error) throw databaseError('Upserting hudl_games', error);
      console.log(`Upserted 1 hudl_games row: ${row.name}`);
    },
    writeRoster: async (rows) => {
      const { error } = await db.from('hudl_game_roster').upsert(rows, { onConflict: ROSTER_CONFLICT_COLUMNS });
      if (error) {
        throw databaseError('Upserting hudl_game_roster (the game row may already be written; rerun is safe)', error);
      }
      console.log(`Upserted ${rows.length} hudl_game_roster rows`);
    },
  });

  console.log(`Collected: game found among ${gamesScanned} scoped games; ${roster.length} roster entries`);

  // The vendor's player.team is kept as reported, even when it disagrees with the query scope.
  const otherTeam = roster.filter((row) => row.reported_team_id !== null && row.reported_team_id !== scope.teamId);
  const noTeam = roster.filter((row) => row.reported_team_id === null);
  if (otherTeam.length || noTeam.length) {
    console.log(`Reported team differs from requested team: ${otherTeam.length}; reported team null: ${noTeam.length}`);
  }

  // Read back what is stored for this scope.
  const stored = await db
    .from('hudl_game_roster')
    .select('player_id', { count: 'exact', head: true })
    .eq('competition_id', scope.competitionId)
    .eq('season_id', scope.seasonId)
    .eq('game_id', scope.gameId)
    .eq('requested_team_id', scope.teamId);
  if (stored.error) throw databaseError('Reading back hudl_game_roster', stored.error);
  console.log(`Stored roster rows for this game and team: ${stored.count}`);
  if (stored.count !== roster.length) {
    // Rows are never deleted, so players missing from this response remain stored.
    console.warn(`Stored count differs from this fetch (${roster.length}); older rows are kept, not deleted`);
  }
  console.log(`Complete: game ${game.game_id} (${game.vendor_date})`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Hudl import failed');
  process.exitCode = 1;
});
