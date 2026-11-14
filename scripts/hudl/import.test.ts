import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fetchAllPages, importHudlGame, type HudlImportScope, type PageFetcher } from '../../src/lib/hudl/import';
import type { HudlGame, HudlPlayer } from '../../src/lib/hudl/types';

const scope: HudlImportScope = { competitionId: 1446, seasonId: 1052, teamId: 10, gameId: 500 };
const fixedNow = () => new Date('2026-11-14T12:00:00Z');

const game: HudlGame = {
  id: 500,
  name: 'Away @ Home',
  date: '2024-09-07',
  homeTeam: { id: 10, name: 'Home' },
  awayTeam: { id: 20, name: 'Away' },
};

function player(id: number, overrides: Partial<HudlPlayer> = {}): HudlPlayer {
  return {
    id,
    name: `Player ${id}`,
    team: { id: 10, name: 'Home' },
    mostCommonNumber: id,
    mostCommonPosition: { generalPosition: 'WR' },
    ...overrides,
  };
}

// Serves a fixed list in pages, like the vendor's limit/offset behavior.
function pagesOf<T>(items: T[], totalCount = items.length): PageFetcher<T> {
  return async (offset, limit) => ({ totalCount, items: items.slice(offset, offset + limit) });
}

function recordingWriters() {
  const calls: string[] = [];
  return {
    calls,
    writeGame: async () => { calls.push('game'); },
    writeRoster: async () => { calls.push('roster'); },
  };
}

test('collects every page, advancing by the number of items returned', async () => {
  const offsets: number[] = [];
  const items = Array.from({ length: 59 }, (_, i) => i);
  const result = await fetchAllPages(async (offset, limit) => {
    offsets.push(offset);
    // Return fewer items than requested to prove the offset follows actual counts.
    return { totalCount: 59, items: items.slice(offset, offset + Math.min(limit, 20)) };
  }, 'Test');
  assert.deepEqual(result, items);
  assert.deepEqual(offsets, [0, 20, 40]);
});

test('rejects incomplete or inconsistent pagination', async () => {
  await assert.rejects(fetchAllPages(pagesOf([1, 2], 5), 'Test'), /empty page at offset 2 of 5/);
  let call = 0;
  await assert.rejects(
    fetchAllPages(async () => ({ totalCount: call++ === 0 ? 4 : 6, items: [1, 2] }), 'Test'),
    /totalCount changed from 4 to 6/,
  );
  await assert.rejects(fetchAllPages(async () => ({ totalCount: 1, items: [1, 2] }), 'Test'), /more than totalCount/);
  await assert.rejects(
    fetchAllPages(async () => ({ totalCount: null, items: [] }) as never, 'Test'),
    /invalid totalCount/,
  );
});

test('writes the game before the roster and maps vendor fields', async () => {
  const writers = recordingWriters();
  let writtenRoster: unknown[] = [];
  const result = await importHudlGame({
    scope,
    now: fixedNow,
    fetchGamesPage: pagesOf([{ ...game, id: 499 }, game]),
    fetchPlayersPage: pagesOf([
      player(1),
      player(2, { team: null, mostCommonNumber: null, mostCommonPosition: null }),
      player(3, { team: { id: 99, name: 'Other' } }),
    ]),
    writeGame: writers.writeGame,
    writeRoster: async (rows) => { writtenRoster = rows; await writers.writeRoster(); },
  });

  assert.deepEqual(writers.calls, ['game', 'roster']);
  assert.equal(result.gamesScanned, 2);
  assert.deepEqual(result.game, {
    competition_id: 1446,
    season_id: 1052,
    game_id: 500,
    name: 'Away @ Home',
    vendor_date: '2024-09-07',
    home_team_id: 10,
    home_team_name: 'Home',
    away_team_id: 20,
    away_team_name: 'Away',
    fetched_at: '2026-11-14T12:00:00.000Z',
  });
  assert.equal(writtenRoster.length, 3);
  // Nulls stay null and a disagreeing vendor team is preserved, not discarded.
  assert.deepEqual(result.roster[1], {
    competition_id: 1446,
    season_id: 1052,
    game_id: 500,
    requested_team_id: 10,
    player_id: 2,
    name: 'Player 2',
    reported_team_id: null,
    reported_team_name: null,
    most_common_number: null,
    general_position: null,
    fetched_at: '2026-11-14T12:00:00.000Z',
  });
  assert.equal(result.roster[2].reported_team_id, 99);
  assert.equal(result.roster[2].requested_team_id, 10);
});

test('a failed roster page prevents all writes', async () => {
  const writers = recordingWriters();
  const players = Array.from({ length: 30 }, (_, i) => player(i + 1));
  await assert.rejects(importHudlGame({
    scope,
    now: fixedNow,
    fetchGamesPage: pagesOf([game]),
    fetchPlayersPage: async (offset, limit) => {
      if (offset > 0) throw new Error('Hudl GraphQL request returned HTTP 502');
      return { totalCount: players.length, items: players.slice(offset, offset + limit) };
    },
    ...writers,
  }), /HTTP 502/);
  assert.deepEqual(writers.calls, []);
});

test('rejects duplicate player IDs, out-of-scope games and empty rosters before writing', async () => {
  const cases: { games: HudlGame[]; players: HudlPlayer[]; error: RegExp }[] = [
    { games: [game], players: [player(1), player(1)], error: /Player 1 appears more than once/ },
    { games: [{ ...game, id: 501 }], players: [player(1)], error: /Game 500 is not in competition 1446/ },
    {
      games: [{ ...game, homeTeam: { id: 30, name: 'Other' } }],
      players: [player(1)],
      error: /Team 10 is neither home nor away/,
    },
    { games: [game], players: [], error: /is empty/ },
    { games: [game], players: [player(1, { name: ' ' })], error: /Player 1 has no name/ },
    { games: [game], players: [player(1, { id: 2 ** 60 })], error: /without a valid id/ },
  ];
  for (const { games, players, error } of cases) {
    const writers = recordingWriters();
    await assert.rejects(importHudlGame({
      scope,
      now: fixedNow,
      fetchGamesPage: pagesOf(games),
      fetchPlayersPage: pagesOf(players),
      ...writers,
    }), error);
    assert.deepEqual(writers.calls, []);
  }
});
