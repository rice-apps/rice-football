# PFF client and franchise import

PFF API access, development database imports and lookups were verified live on
14 November 2026. Verification scope is recorded under Checks.

## Setup

Use Node 22+ and run `npm ci`. In ignored `.env.local`, preserve existing entries
and set:

```text
PFF_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SECRET_KEY=
```

Obtain the development secret privately from the lead. Don't use the publishable
key for server writes. The sample fetch only needs `PFF_API_KEY`.

## Sample fetch

```bash
npx tsx --env-file=.env.local scripts/pff/fetch-franchises.ts
```

The 7 November run printed:

```text
Retrieved 504 NCAA franchise records.
Rice Owls franchise ID: 275
```

Counts can change. The sample requires one Rice Owls match and prints only a summary.

## Authentication

Base URL: `https://api.profootballfocus.com`.

`createPffClient()` sends `POST /auth/login` with `x-api-key: <PFF_API_KEY>` and
keeps the returned `jwt` in memory. `getFranchises()` sends `Authorization: Bearer
<jwt>` to `GET /v1/ncaa/franchises`, including for repeated or concurrent calls.
There is no token file, refresh or retry; if a token expires, start a new run.
`src/lib/pff/` is Node-only and must not be imported by browser components.

## Returned fields

The response contains `franchises` and `leagues`. `getFranchises()` validates and
returns only `franchises`, preserving vendor fields.

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | integer | PFF franchise identifier; Rice Owls was `275` on 7 November |
| `name` | string | Franchise name |
| `league_id` | integer | PFF league identifier |
| `league` | string | League label |
| `sportradar_id` | string or null | Nullable vendor field, returned unchanged |

These are PFF IDs, not internal, Hudl or CFBD IDs. Coverage, pagination and rate
limits are not established.

## Import into Supabase

```bash
npx tsx --env-file=.env.local scripts/pff/import-franchises.ts
```

The existing `pff_franchises` table has these five fields plus `fetched_at`.
The lead owns schema changes; don't rerun setup SQL. The import:

1. Fetches the franchise response before writes.
2. Rejects an empty list, invalid records, unsafe integer IDs or duplicate IDs.
3. Reads the stored count; missing/failed counts or a smaller incoming list stop writes.
4. Sets one UTC `fetched_at` (collection time) on every row.
5. Upserts on `id` in one request, replacing values including nulls. It never deletes rows.
6. Logs source/scope, collected count and confirmed upserted count.

Failures exit nonzero. The count guard can't prove first-import completeness or
detect equal-sized substitutions; legitimate removals/ID changes can require lead review.

Failed/unconfirmed upserts may already have written rows. Reruns replace the same
IDs without appending duplicates. Run one import at a time. Requests time out
after 30 seconds; there is no automatic retry or scheduling.

## Database lookups

`src/lib/pff/db.ts` reads stored rows only and never calls the PFF API.

- `getPffFranchise(id)` returns the five vendor fields, or `null` if not stored.
- `searchPffFranchises(name)` trims `name` and returns up to 50 franchises whose
  names contain it as a literal, case-insensitive substring, ordered by name then
  ID. Blank names are rejected.

Read-only example, after an import with development credentials:

```bash
npx tsx --env-file=.env.local -e '
import { getPffFranchise, searchPffFranchises } from "./src/lib/pff/db";

async function main() {
  const matches = (await searchPffFranchises("Rice Owls")).filter((row) => row.name === "Rice Owls");
  if (matches.length !== 1) {
    throw new Error(`Expected one Rice Owls row, found ${matches.length}.`);
  }
  const franchise = await getPffFranchise(matches[0].id);
  if (!franchise) {
    throw new Error("Rice Owls was not found by ID.");
  }
  console.log(`${franchise.id} ${franchise.name}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Lookup failed.");
  process.exitCode = 1;
});
'
```

## Errors and checks

Configuration, request and validation errors exclude response bodies, URLs, keys
and JWTs. PFF requests reject redirects.

```bash
npx tsx --test scripts/pff/*.test.ts
```

All 34 offline tests passed on 14 November using fictional responses without
credentials. Development integration checks that day confirmed:

- First import: 504 unique IDs and one shared `fetched_at`.
- Second import: the same 504 IDs, no duplicates and a refreshed timestamp.
- Database-only case-insensitive Rice search and ID lookup returned Rice Owls, ID 275.
- Literal-character searches worked; empty/duplicate inputs made no requests and preserved stored data.
- Exact count headers worked. An unauthenticated table read returned HTTP 401;
  RLS/catalog settings were not introspected.

Additional endpoints, scheduling and cross-vendor matching are out of scope.

Reference: [PFF master data documentation](https://api.profootballfocus.com/doc/master-data)
(requires sign-in). Field structure above was checked against live responses.
