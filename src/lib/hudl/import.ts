// Fetch, validate and map one Hudl game plus its scoped roster for storage.
// Mappings follow docs/storage-contract.md section 3. Nothing here talks to the
// database directly: callers pass writers, so a failed fetch can never write.
import type { HudlGame, HudlPage, HudlPlayer } from './types';

export type HudlImportScope = {
  competitionId: number;
  seasonId: number;
  teamId: number;
  gameId: number;
};

export type HudlGameRow = {
  competition_id: number;
  season_id: number;
  game_id: number;
  name: string;
  vendor_date: string;
  home_team_id: number;
  home_team_name: string;
  away_team_id: number;
  away_team_name: string;
  fetched_at: string;
};

export type HudlGameRosterRow = {
  competition_id: number;
  season_id: number;
  game_id: number;
  requested_team_id: number;
  player_id: number;
  name: string;
  reported_team_id: number | null;
  reported_team_name: string | null;
  most_common_number: number | null;
  general_position: string | null;
  fetched_at: string;
};

export const GAME_CONFLICT_COLUMNS = 'competition_id,season_id,game_id';
export const ROSTER_CONFLICT_COLUMNS = 'competition_id,season_id,game_id,requested_team_id,player_id';

// The documented maximum page size for these queries.
export const PAGE_LIMIT = 25;

export type PageFetcher<T> = (offset: number, limit: number) => Promise<HudlPage<T>>;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isNonBlank(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

// Advance by the number of items actually returned and stop at totalCount.
// Anything that suggests a partial collection is an error, never a short result.
export async function fetchAllPages<T>(fetchPage: PageFetcher<T>, label: string, limit = PAGE_LIMIT): Promise<T[]> {
  const items: T[] = [];
  let expectedTotal: number | undefined;

  while (expectedTotal === undefined || items.length < expectedTotal) {
    const page = await fetchPage(items.length, limit);
    if (!isObject(page) || !Array.isArray(page.items)) {
      throw new Error(`${label} page at offset ${items.length} has no items array`);
    }
    if (typeof page.totalCount !== 'number' || !Number.isSafeInteger(page.totalCount) || page.totalCount < 0) {
      throw new Error(`${label} page at offset ${items.length} has an invalid totalCount`);
    }
    if (expectedTotal === undefined) {
      expectedTotal = page.totalCount;
    } else if (page.totalCount !== expectedTotal) {
      throw new Error(`${label} totalCount changed from ${expectedTotal} to ${page.totalCount} while paging`);
    }
    if (page.items.length === 0 && items.length < expectedTotal) {
      throw new Error(`${label} returned an empty page at offset ${items.length} of ${expectedTotal}`);
    }
    items.push(...page.items);
    if (items.length > expectedTotal) {
      throw new Error(`${label} returned ${items.length} items, more than totalCount ${expectedTotal}`);
    }
  }
  return items;
}

function teamFields(team: unknown, label: string): { id: number; name: string } {
  if (!isObject(team) || !isId(team.id) || typeof team.name !== 'string') {
    throw new Error(`${label} is missing a valid id/name`);
  }
  return { id: team.id, name: team.name };
}

export function toGameRow(games: HudlGame[], scope: HudlImportScope, fetchedAt: string): HudlGameRow {
  const matches = games.filter((game) => isObject(game) && game.id === scope.gameId);
  if (matches.length === 0) {
    throw new Error(
      `Game ${scope.gameId} is not in competition ${scope.competitionId}, season ${scope.seasonId}, team ${scope.teamId}`,
    );
  }
  if (matches.length > 1) {
    throw new Error(`Game ${scope.gameId} appeared ${matches.length} times in the games query`);
  }

  const game = matches[0];
  if (!isNonBlank(game.name) || !isNonBlank(game.date)) {
    throw new Error(`Game ${scope.gameId} is missing a name or date`);
  }
  const home = teamFields(game.homeTeam, `Game ${scope.gameId} homeTeam`);
  const away = teamFields(game.awayTeam, `Game ${scope.gameId} awayTeam`);
  if (home.id !== scope.teamId && away.id !== scope.teamId) {
    throw new Error(`Team ${scope.teamId} is neither home nor away in game ${scope.gameId}`);
  }

  return {
    competition_id: scope.competitionId,
    season_id: scope.seasonId,
    game_id: game.id,
    name: game.name,
    // Kept as received: date-only/timezone semantics are not confirmed yet.
    vendor_date: game.date,
    home_team_id: home.id,
    home_team_name: home.name,
    away_team_id: away.id,
    away_team_name: away.name,
    fetched_at: fetchedAt,
  };
}

function toRosterRow(player: HudlPlayer, scope: HudlImportScope, fetchedAt: string): HudlGameRosterRow {
  if (!isObject(player) || !isId(player.id)) {
    throw new Error('Roster contains a player without a valid id');
  }
  if (!isNonBlank(player.name)) {
    throw new Error(`Player ${player.id} has no name`);
  }

  // A null team stays null; it does not mean the requested team.
  const team = player.team === null ? null : teamFields(player.team, `Player ${player.id} team`);

  const number = player.mostCommonNumber;
  if (number !== null && !(Number.isInteger(number) && number >= 0 && number <= 2_147_483_647)) {
    throw new Error(`Player ${player.id} has an invalid mostCommonNumber`);
  }

  const position = player.mostCommonPosition;
  if (position !== null && (!isObject(position) || (position.generalPosition !== null && typeof position.generalPosition !== 'string'))) {
    throw new Error(`Player ${player.id} has an invalid mostCommonPosition`);
  }

  return {
    competition_id: scope.competitionId,
    season_id: scope.seasonId,
    game_id: scope.gameId,
    requested_team_id: scope.teamId,
    player_id: player.id,
    name: player.name,
    reported_team_id: team?.id ?? null,
    reported_team_name: team?.name ?? null,
    most_common_number: number,
    general_position: position?.generalPosition ?? null,
    fetched_at: fetchedAt,
  };
}

export function toRosterRows(players: HudlPlayer[], scope: HudlImportScope, fetchedAt: string): HudlGameRosterRow[] {
  if (players.length === 0) {
    throw new Error(`Roster for game ${scope.gameId}, team ${scope.teamId} is empty`);
  }
  const rows = players.map((player) => toRosterRow(player, scope, fetchedAt));

  const seen = new Set<number>();
  for (const row of rows) {
    if (seen.has(row.player_id)) {
      throw new Error(`Player ${row.player_id} appears more than once in the roster`);
    }
    seen.add(row.player_id);
  }
  return rows;
}

export type HudlGameImport = {
  scope: HudlImportScope;
  fetchGamesPage: PageFetcher<HudlGame>;
  fetchPlayersPage: PageFetcher<HudlPlayer>;
  writeGame: (row: HudlGameRow) => Promise<void>;
  writeRoster: (rows: HudlGameRosterRow[]) => Promise<void>;
  now?: () => Date;
};

export type HudlGameImportResult = {
  game: HudlGameRow;
  roster: HudlGameRosterRow[];
  gamesScanned: number;
};

export async function importHudlGame({
  scope,
  fetchGamesPage,
  fetchPlayersPage,
  writeGame,
  writeRoster,
  now = () => new Date(),
}: HudlGameImport): Promise<HudlGameImportResult> {
  // One collection time for the whole scope.
  const fetchedAt = now().toISOString();

  // Fetch and validate everything before the first write.
  const games = await fetchAllPages(fetchGamesPage, 'Games');
  const game = toGameRow(games, scope, fetchedAt);
  const players = await fetchAllPages(fetchPlayersPage, 'Players');
  const roster = toRosterRows(players, scope, fetchedAt);

  // The roster has a foreign key to the game, so the game goes first.
  await writeGame(game);
  await writeRoster(roster);

  return { game, roster, gamesScanned: games.length };
}
