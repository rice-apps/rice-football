# Development storage contract — November 14, 2026

Status: development handoff. On November 14 the lead reported successfully running
the SQL and seeing the six new tables alongside questions. The agent has not
independently verified hosted privileges or schema: the local SUPABASE_SECRET_KEY
is missing. This is not the final football database or a client-approved production
model. Proposed Q&A permissions still require lead confirmation before enforcement.

## Decisions and boundaries

The client wants separate source tables and prefers PFF over CFBD for equivalent
facts. This contract preserves separate sources. It does not match identities or
implement precedence: PFF franchises and CFBD schedule rows are not equivalent
facts. Never substitute vendor IDs for each other.

The first scope is Rice's CFBD schedule, one conference's standings, all franchises
returned by the verified PFF endpoint, and one explicit Hudl game/team roster.
This limited importer scope does not mean the eventual database contains only Rice.

Reports persist metadata only. Files, HTML hosting, script execution, news sourcing,
notifications, and production access controls are outside this storage setup.
No raw JSON, tracking files, JWTs, API keys, or signed download URLs go in these tables.
Selected vendor fields are preserved under the mappings below; raw-response archival
and source revision history require a later decision.

## Apply the SQL

File: `supabase/setup/2026-11-14-source-data.sql`.

1. Lead reviews this contract, target project, licensed-data access, and table names.
2. Inspect existing names/schema without exporting real records. If a proposed table
   already exists, stop and compare it; do not drop or automatically alter it.
3. Lead runs the SQL once in the approved development project's SQL editor. It is a
   single transaction and intentionally fails on existing table names.
4. Verify all six tables exist, RLS is enabled, no policies were added, and browser
   roles lack table privileges. Test server access without exposing credentials.

The script does not change existing Q&A tables, auth accounts, Storage buckets, or
Data API settings. Confirm `public` is exposed for server PostgREST access. Do not
add anonymous policies or broaden schema exposure to work around a configuration
failure. `service_role` uses existing schema access and receives table read/write
privileges here. There are no serial sequences in these new tables.

## Shared importer behavior

- Server/Node commands use `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY`, plus
  the source API key. No keys appear in source, output, rows, or command arguments.
- Fetch every required page and validate the entire scoped collection BEFORE writes.
  Reject wrong shapes/types, unsafe numeric IDs, missing required fields, duplicate
  conflict keys, and inconsistent requested scope. Do not coerce null into zero.
- IDs stored as SQL bigint must be safe integers in current JavaScript clients;
  reject larger values until string transport has been explicitly implemented.
- Set one UTC `fetched_at` for the collected scope. It means collection time, not
  game/event time or a vendor update time. Pass it explicitly on upsert.
- Upsert using the exact conflict columns below. Reruns replace current selected
  values, including legitimate nulls. Do not increment counts or append duplicates.
- Never delete rows missing from a response. Empty or unexpectedly truncated
  responses are failures for these initial nonempty scopes; preserve existing rows.
- Failed fetch/validation means zero writes. Separate writes/batches are NOT a
  transaction: a database failure can leave a partial import. Exit unsuccessfully,
  report that possibility, and rerun safely. Do not claim atomic publication.
- Log source, scope, collected count, successfully written count, and safe error
  summary. Report affected rows as "upserted", not invented inserted/updated counts.
- Exit 0 only after all planned writes succeed; otherwise nonzero. No prompts.
  Database errors must not dump payloads or secrets. Use bounded request timeouts.
- One process per source/scope at a time; no concurrent imports of the same scope.
  The lead will enforce workflow concurrency and configure schedules later.
- Database run-history tables, checkpoints, deletion reconciliation, backfills beyond
  explicit scope, and incremental vendor cursors are not required this sprint.

## 1. CFBD mapping and interface

Command to implement:

```sh
npx tsx --env-file=.env.local scripts/cfbd/import.ts --season 2026 --conference AAC
```

Reuse `getRiceSchedule` and `getConferenceStandings`. This is the normalized app
output, not an archival copy of the full CFBD response. Fetch both before writing.

### cfbd_rice_schedule

Conflict columns: `season,rice_team_id,game_id`.

| Column | Input |
| --- | --- |
| season | validated command argument |
| rice_team_id | existing `RICE_TEAM.cfbdId` (242) |
| game_id | gameId, preserved as text |
| week | week |
| opponent | opponent |
| home_away | homeAway |
| game_date | date, valid ISO timestamp |
| start_time_tbd | startTimeTbd |
| conference_game | conferenceGame |
| status | status |
| rice_score | riceScore, nullable |
| opponent_score | opponentScore, nullable |
| fetched_at | collection timestamp |

Known scores need not imply completed status. Preserve TBD flag; do not turn a
placeholder kickoff into an asserted time. No neutral-site semantics are added.

### cfbd_conference_standings

Conflict columns: `season,conference,team`.

Use season argument, trimmed uppercase CFBD conference abbreviation, vendor team
name unchanged, and map conferenceWins/Losses and overallWins/Losses to snake_case.
Include fetched_at. Names are a temporary source-local key because the existing
output omits IDs. Renames may leave stale rows; report that limitation rather than
inventing identity matching. Ordering is not an official conference rank.

Verification: import twice, check stable key counts and unchanged unrelated scopes,
read Rice's stored schedule, and test fetch failure before writing. Homepage stays
on its existing direct API path until a separate integration ticket.

## 2. PFF mapping and interface

```sh
npx tsx --env-file=.env.local scripts/pff/import-franchises.ts
```

Table: `pff_franchises`. Conflict column: `id` (PFF identifier).
Map existing validated `id,name,league_id,league,sportradar_id` unchanged and add
fetched_at. Sportradar ID remains text/null; it is not a proven mapping key.
Duplicate franchise IDs in a single response fail validation. Do not assume every
returned franchise is currently active or belongs to the same competition level.

Database helper interfaces to implement:

```ts
getPffFranchise(id: number): Promise<PffFranchise | null>
searchPffFranchises(name: string): Promise<PffFranchise[]>
```

Name search: trimmed, case-insensitive literal substring, at most 50 results,
stable name/id order; reject blank queries and handle search wildcard escaping.
Verification: import twice with stable count; find Rice by name and retrieve by ID
from the database without calling the vendor again.

## 3. Hudl mapping and interface

```sh
npx tsx --env-file=.env.local scripts/hudl/import-game.ts \
  --competition-id 1446 --season-id 1052 --team-id 1001249 --game-id 1504854
```

Kickoff input verified read-only on November 14: game 1504854, competition 1446,
season ID 1052, team 1001249. The games query returned this game and the scoped
player query reported 59 entries with a successful first page. Complete pagination
has not been verified. Vendor season IDs are NOT calendar years. Reuse existing game/player queries and clients; do not invent new
endpoints or reuse the sample's first page as a complete roster.

- Page the scoped games query, verify the selected ID exists in that competition,
  season, and team scope, and verify the requested team is one of its participants.
- Page players with the same scope plus selected game ID. Advance offset by actual
  returned item count. Stop at totalCount; early empty pages, inconsistent totals,
  duplicate player IDs, or failed pages are failures before database writes.
- `player.team` may be null or disagree with the requested team. Preserve that as
  reported data; do not claim it proves historical membership. Query scope provides
  the game-roster association. Do not silently discard disagreements.

### hudl_games

Conflict columns: `competition_id,season_id,game_id`.
Use scope arguments, `id -> game_id`, name, `date -> vendor_date`, homeTeam/awayTeam
IDs and names, fetched_at. Keep the original date string: its date-only/timezone
semantics need confirmation before normalizing it into a timestamp.

### hudl_game_roster

Conflict columns:
`competition_id,season_id,game_id,requested_team_id,player_id`.

Use scope arguments, `id -> player_id`, name, `team.id/name -> reported_team_id/name`
(both null if team is null), `mostCommonNumber -> most_common_number`,
`mostCommonPosition.generalPosition -> general_position` (null if position null),
fetched_at. Do not replace unknown numbers/positions with 0/empty text.

This table stores player details PER GAME AND REQUESTED TEAM. It deliberately
combines player snapshot and roster association instead of introducing an
unverified global player table. Another game's import cannot overwrite history.
The details are vendor values observed at fetch time, not guaranteed historical
attributes at kickoff. Write the game first, then roster; verify foreign keys.

Verification: known game and complete scoped roster, repeat without duplicates,
stored associations resolvable, simulated page failure prevents writes. No tracking
payloads, download URLs, cross-source identity, or automatic game discovery.

## 4. Report metadata contract

Table: `reports`. Existing `Report` fields map directly to snake_case DB columns:
`fileType -> file_type`, `fileUrl -> file_url`, `createdAt -> created_at`, with
`updated_at` added. Convert back at the application boundary.

- UUID is generated by the database for new metadata. A name is NOT a unique key.
  No upsert by name. Existing fixture IDs such as report-1 are not UUIDs.
- Do not silently insert fixtures. Seed approved fictional metadata separately if
  desired; libraries should distinguish empty database state from sample content.
- Name: trimmed, required, 200 characters max. Description: 4000 max, default empty.
- Categories/kinds: existing exact unions. Normalize extension to lowercase (including
  `.R -> .r`); enforce existing kind/extension combinations on server and in SQL.
- Tags: array of strings, trim, drop blanks, deduplicate case-insensitively keeping
  first casing; max 8 tags and 30 characters each. SQL limits count; server validates
  each tag. These bounds match the existing prototype.
- Selected file name/content is NOT saved. New submissions have file_url = null.
  The server may attach a hardcoded allowlisted existing `/reports/` sample path;
  never accept arbitrary client URLs or imply a selected file was uploaded.
- Server/database own timestamps. Set updated_at on future updates; current ticket
  only creates/lists metadata. Retries after ambiguous create failures can duplicate
  metadata; creation idempotency is future work, not guaranteed here.

Proposed narrow API: GET /api/reports for static metadata; GET /api/analyst/reports
for all metadata; POST /api/analyst/reports for validated creation. Server responses
use existing Report shape. Staff reads MUST filter kind=static in server queries,
not only hide scripts after returning them. Keep search/category behavior working;
bounded fixtures can use client search initially, but do not silently truncate a
larger database collection. Include paging or an explicit small development cap.

These metadata APIs remain a fictional-data development workflow until report auth
is connected. Do not expose licensed/sensitive reports through them. Task 5 below
only secures Q&A; the private database alone does not protect privileged APIs.

## 5. Q&A authorization handoff (no new table)

Reuse getCurrentUser and existing app_metadata.access_level. Require verified login
for Q&A GET/POST; only analyst_full/analyst_limited may PATCH and enter the analyst
Q&A page. This shared Q&A permission is a PROPOSED lead decision, not a definition
of dataset access. coach/front_office share read/submit permissions. Unknown/unset
levels are denied. Return 401 when signed out, 403 for insufficient level, and 503
when verification is unavailable (fail closed). Extend proxy matcher for affected
pages. Keep manually entered human name/title because current logins may be shared;
do not pretend they identify an authenticated individual.

No auth account schema change, new shared accounts, or password distribution is
part of the SQL. Use team-controlled email addresses or provisioned test accounts;
the client still needs to confirm permanent account ownership/emails. Do not invent
personal emails or rely on a student's inbox for long-lived ownership.

## Lead review / developer handoff

Before assigning the two-hour implementation tickets, approve:

- The target development project and the six proposed table names/keys.
- Latest-value upserts, no deletion/history, and partial-write/rerun semantics.
- Hudl per-game snapshots and the known accessible input game.
- Metadata-only reports and the temporary fictional-data API boundary.
- Shared Q&A access for both analyst levels; full/restricted data rules stay open.

Lead applies SQL and supplies credentials privately. Developers implement only
mapping, validation, command/API logic and checks. Lead later owns Actions secrets,
schedules, concurrency, and operational monitoring. No workflow is added here.

## Validation performed

On November 14, 2026 the SQL was applied successfully to a disposable local
PostgreSQL database with stand-in anon/authenticated/service_role roles. Checks
confirmed six RLS-enabled tables, denied anonymous table reads, server insert
privileges, duplicate-safe PFF upserts, Hudl foreign-key enforcement, report
kind/extension constraints, and generated report UUID/defaults. The temporary
instance was stopped and removed. This does not verify hosted Supabase configuration,
PostgREST exposure, importers, live payload coverage, or end-to-end application use.
