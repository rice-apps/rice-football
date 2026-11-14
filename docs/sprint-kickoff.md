# Developer kickoff — November 14, 2026

Read AGENTS.md and docs/storage-contract.md before implementation. The SQL file is
supabase/setup/2026-11-14-source-data.sql. The lead reports its six tables were
created successfully; do NOT run it again on that project or recreate the tables.
No importer is implemented by this handoff. Existing application behavior is unchanged.

## Readiness

- CFBD, PFF, Hudl vendor credentials are present locally; values are not published.
- Supabase URL and publishable key are present locally.
- SUPABASE_SECRET_KEY is MISSING from the lead's local .env. Obtain the development
  project's secret via the lead's approved private channel. No database-writing
  task can verify integration until the secret is provided.
- Hosted table access, grants and auth-account roles could not be inspected without
  that key. The account claims in existing docs are not a new verification.
- Hudl game/roster first-page access verified live; input below is ready.
- Passwords were not retrieved, created, reset, or shared. Use existing provisioned
  test accounts. The lead must confirm their access-level metadata and supply logins.

## Start work

```sh
git switch main
git pull --ff-only
git switch -c <assigned-branch>
nvm use
npm ci
```

If your working tree has changes, preserve them before switching branches. If no
.env.local exists, copy .env.example to .env.local; otherwise edit the existing file
without overwriting credentials. Receive values privately. Never commit populated
environment files or put tokens in commands, screenshots, test output, or PRs.

## Assignments and inputs

| Ticket | Suggested branch | Fixed input / expected outcome |
| --- | --- | --- |
| CFBD importer | feature/cfbd-ingestion | season 2026, conference AAC; repeatable schedule/standings writes |
| PFF importer | feature/pff-ingestion | existing franchises endpoint; repeatable import and database lookups |
| Hudl importer | feature/hudl-ingestion | competition 1446, season ID 1052, team 1001249, game 1504854; game plus complete scoped roster |
| Report metadata | feature/report-metadata | persist metadata/tags; libraries read stored records; no file upload |
| Q&A permissions | feature/qa-authorization | existing session helper and four account access-level labels; API enforcement after lead confirms matrix |

Hudl input is a known accessible historical game, deliberately chosen for a bounded
first import. Season ID 1052 is a vendor identifier, not the year 1052. First-page
roster total was 59 on November 14; don't hardcode that count as a permanent truth.

See the storage contract for field mappings, keys, proposed command/helper signatures,
and task boundaries. The lead owns schema changes and future Actions scheduling.
The scripts must be noninteractive and return a nonzero status on failure.

## Credential checklist — distribute privately, not through Git

| Task | Variables / other access |
| --- | --- |
| CFBD | NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, CFBD_API_KEY |
| PFF | NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, PFF_API_KEY |
| Hudl | NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, HUDL_API_KEY |
| Reports | NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY |
| Q&A auth | NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY; staff and analyst test logins |

Only trusted developers running server/scripts in the approved development project
receive its secret key. It is elevated project access, not per-table permission.
No dashboard membership is required just to run these clients. Do not share the
production project's secret as a shortcut.

## Auth decision awaiting lead confirmation

Proposed Q&A matrix: coach/front_office read and submit; analyst_full/analyst_limited
also answer and update status. Unknown levels denied. This does not define licensed
dataset access or individual identities behind shared accounts. Keep human name/title
separate from the verified account. Lead confirms this matrix and privately supplies
existing test accounts; don't invent emails or reset shared passwords.

## Acceptance

Each importer PR demonstrates a successful bounded import, duplicate-safe rerun,
readback, and failure behavior preserving existing data. Don't claim cross-table
atomicity or full raw archival. Report PR demonstrates metadata surviving refresh
and category/search behavior; auth PR checks direct unauthorized API requests.
Include actual commands/results and limitations. Don't export licensed records in PRs.
