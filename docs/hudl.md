# Hudl IQ access and samples

Verified against the live API on 1 November 2026. This is a sample fetcher, with
no database, normalisation or application UI.

## Run

Use Node 22+, run `npm ci`, and put `HUDL_API_KEY=...` in the ignored `.env.local`.
The key's placeholder already exists in `.env.example`.

```bash
npx tsx --env-file=.env.local scripts/hudl/fetch-sample.ts
```

Each run prints a new directory under `samples/hudl/raw/sample-*`. It saves
`games.json`, `games-next-page.json`, `players.json`, `plays.json`,
`tracking.json` and `selection.json`. API responses are saved as received;
`selection.json` is our record of the game/play association and download attempts.
Raw data stays Git-ignored because the repository is public and play responses
include signed URLs. Use an approved private team location to share these files.

Optional environment overrides (no additional credentials):

| Variable | Default | Meaning |
| --- | --- | --- |
| `HUDL_COMPETITION_ID` | `1446` | NCAA |
| `HUDL_SEASON_ID` | `1052` | 2024/2025, used for the verified tracking example |
| `HUDL_TEAM_ID` | `1001249` | Rice Owls |
| `HUDL_GAME_ID` | First returned game | Select another game |
| `HUDL_SAMPLE_LIMIT` | `5` | Records per query, maximum 25 |

Season IDs are vendor IDs, not calendar years. `seasons(competitionId: 1446)`
returned `1085` for 2025/2026 and `1118` for 2026/2027. Account coverage may differ.

## Import one game and roster into Supabase

Stores one explicit game in `hudl_games` and its scoped roster in `hudl_game_roster`
(mappings: `docs/storage-contract.md` section 3). Needs `HUDL_API_KEY`,
`NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY` in `.env.local`.

```bash
npx tsx --env-file=.env.local scripts/hudl/import-game.ts \
  --competition-id 1446 --season-id 1052 --team-id 1001249 --game-id 1504854
```

All four IDs are required. The command pages the scoped games query (25 per page) and
fails unless the game is in that scope with the team as home or away. It then pages
the players query with the same scope plus `gameIds`. Pages advance by the number of
items returned until `totalCount`. An early empty page, a changed `totalCount`, a
failed page, invalid fields or a duplicate player ID fails the run before any write.
It then upserts the game, then the roster, and reads back the stored roster count.

Vendor `player.team` is kept as `reported_team_id/name`, null when the vendor
returns null. The query scope is `requested_team_id`. The output reports
disagreements; they are kept, not discarded. Unknown numbers and positions stay null.

Reruns replace the selected values for the same keys and never add duplicates or
delete rows. The game and roster are separate writes. If the roster write fails,
the game row may already be stored. The command exits nonzero; rerun it.

On 14 November 2026 this stored 1 game (`08/31/2024 Sam Houston State Bearkats -
Rice Owls`, vendor date `2024-08-31`) and 59 roster rows. All 59 reported Rice as
their team. A rerun left 59 rows, and an invalid key or out-of-scope game ID exited 1
without changing stored rows. The count is a snapshot, not an expected constant.

Verify in the Supabase SQL editor:

```sql
select game_id, name, vendor_date, home_team_name, away_team_name, fetched_at
from hudl_games where game_id = 1504854;

-- Should match the import's roster count, with no repeated player_id.
select count(*) as rows, count(distinct player_id) as players
from hudl_game_roster
where competition_id = 1446 and season_id = 1052
  and game_id = 1504854 and requested_team_id = 1001249;

-- Every roster row resolves to its stored game.
select count(*) from hudl_game_roster r
left join hudl_games g using (competition_id, season_id, game_id)
where g.game_id is null;
```

Tests (no network or database): `npx tsx --test scripts/hudl/import.test.ts`.
Not included: tracking downloads, signed URLs, season-wide imports, scheduling and
player matching.

## Authentication and queries

Send GraphQL JSON via `POST https://amf-iq-api.statsbomb.com/api` with
`Content-Type: application/json`, `Authorization: apikey <key>` and
`Accept-Version: v2023q2`. Keep the key in server/scripts code.

Tested queries: `competitions`, `seasons`, `teams`, `games`, `players`, `plays`,
schema introspection and `playEvents`. The sample command uses games, players and
plays; it does not require introspection. Use `items`, not `edges`, for the live
`GamePage`, `PlayerPage` and `PlayPage` types.

Games use integer `id`; players use integer `id`; plays use opaque string `id`.
`Play.game.id` links a play to its game. The player query can filter by
`competitionId`, `seasonId`, `teamIds` and `gameIds`. We omit dates of birth.

`games`, `players` and `plays` accept `limit` and `offset` and return
`{ totalCount, items }`. Start at offset 0, then advance by the number returned,
stopping at totalCount or an empty page. No cursor/pageInfo is exposed on these
page types. Keep filters unchanged between pages; ordering stability while the
vendor updates data has not been established.

## Tracking flow and structure

Fetch games, select a game ID, then query
`plays(filters: { competitionId: ..., gameIds: [...] }, limit: ..., offset: 0)`
with `id`, `game { id }` and `trackingURL`. Immediately GET a non-null
`trackingURL`. The observed host is `amf-iq-tracking-prod.s3.amazonaws.com`.
Its URL carries the temporary AWS signature; do not attach the Hudl API key,
print the URL, publish it or treat it as a permanent identifier.

The downloaded JSON has this observed shape:

```ts
{
  tracks: [{
    player: { player_id: number },
    steps: [{ timestamp: number, pitch: { x: number, y: number } }]
  }]
}
```

This is continuous per-player tracking, separate from the event snapshots returned
by `playEvents(...).freezeFrames`. A tracking file has no game/play ID at its root;
retain the query's association in `selection.json`. Its `player_id` is numeric;
the sampled player's ID also appears in the game's event lineup. Cross-vendor
identity matching is outside this task. Timestamp units/origin, coordinate units
and field orientation still need confirmation from Hudl's data dictionary.

The verified season had 12 Rice games; the selected game had 59 Rice roster entries
and 177 plays. With limit 5, consecutive game pages had five distinct records each.
One tracking download was 657,233 bytes, with 22 tracks and 550 steps per track
(12,100 steps total). That is one complete play file, without pagination inside it.
Other plays/games can be different sizes. The client caps any response at 10 MiB
and uses a 30-second request timeout.

## Errors and limitations

A non-null `trackingURL` does not guarantee a downloadable object. The first
sampled play returned S3 `403 AccessDenied`; the next returned `200`. Recent-season
plays also returned 403 in the initial checks. This does not establish whether the
cause is missing objects, account coverage or a vendor permission issue. The
fetcher tries only the requested page's plays, skips 403/404 downloads, records
attempts and exits unsuccessfully if none works. Try another `HUDL_GAME_ID` or ask
Hudl about coverage; do not broaden permissions or invent another endpoint.

GraphQL can return HTTP 200 with `errors`. The client rejects those responses,
non-2xx statuses, missing data and invalid JSON. Neither error messages nor console
output include the key or signed URL. Large downloads, rate limits and complete
season ingestion are not part of this sample task.

```bash
npx tsx --test scripts/hudl/client.test.ts
```

Sources: [Hudl API guide](https://support.hudl.com/s/article/use-statsbombs-api?language=en_US),
[data dictionary](https://support.hudl.com/s/article/data-dictionary?language=en_US),
and the authenticated live schema/responses used for the checks above. Some support
page examples differ from the live schema; use introspection to confirm fields.
