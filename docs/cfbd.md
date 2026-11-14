# CFBD import

Copies Rice's CFBD schedule and one conference's standings into the Supabase tables `cfbd_rice_schedule` and `cfbd_conference_standings`. The column mapping and keys come from the [storage contract](storage-contract.md). The homepage still calls CFBD directly; nothing in the app reads these tables yet.

## Run it

Needs `CFBD_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and `SUPABASE_SECRET_KEY` in `.env.local`.

```bash
npx tsx --env-file=.env.local scripts/cfbd/import.ts --season 2026 --conference AAC
```

`--conference` takes CFBD's abbreviation (`AAC`, not `American Athletic`) and is uppercased. A successful run prints:

```text
CFBD import: season 2026, conference AAC
Collected 12 Rice schedule games and 14 AAC standings rows (fetched_at 2026-11-14T21:06:43.627Z).
Upserted 12 rows into cfbd_rice_schedule.
Upserted 14 rows into cfbd_conference_standings.
Import complete.
```

It exits 0 only when both tables are written; any failure exits 1 with a message.

To read back what's stored for a scope, without calling CFBD:

```bash
npx tsx --env-file=.env.local scripts/cfbd/show-stored.ts --season 2026 --conference AAC
```

## What it does

1. Fetches both collections with the existing `getRiceSchedule()` and `getConferenceStandings()`.
2. Validates every row before writing anything: required fields, types, allowed values, scores either empty or whole numbers (an empty score is never turned into 0), and no duplicate keys. One bad row stops the whole import.
3. Stamps every row with the same `fetched_at`: when the data was collected, not a game time.
4. Upserts on each table's primary key (`season, rice_team_id, game_id` and `season, conference, team`), so rerunning a scope replaces its rows instead of adding duplicates.

Requests to CFBD and Supabase give up after 30 seconds.

## Failures

- A failed fetch or invalid data writes nothing.
- The two tables are written separately, so the import isn't atomic. If the standings write fails after the schedule was written, the message says the import is incomplete. Rerunning the same command is safe.
- Error messages are short and never include row data or keys.

## Limitations

- Rows that disappear from a later response are never deleted.
- Standings are keyed by team name, because the normalized standings have no team ID. A renamed team would leave its old row behind.
- The normalized data doesn't include CFBD's own season or conference fields, so the stored season and conference come from the command's flags.
- Nothing prevents two imports of the same scope from running at once; don't.

## Tests and verification

```bash
npx tsx --test scripts/cfbd/import.test.ts
```

The tests cover flags, validation, column mapping, the conflict keys, and every fetch, validation, and write failure, without network or database access.

Verified November 14, 2026 against the development project, for season 2026 and AAC:

- The first import upserted 12 schedule rows and 14 standings rows.
- A second run left exactly 12 and 14 rows, all with the newer `fetched_at`.
- Runs with an invalid CFBD key and with an invalid Supabase key both exited 1 and left the stored rows and `fetched_at` unchanged.
