# AGENTS.md

## Project: Rice Football Analytics Platform

This repository is for a RiceApps project supporting Rice University Football's analytics department.

This file is the main project-context document for coding agents and developers. Read it before making implementation decisions.

---

# 1. Project Mission

Rice Football's analytics department currently lacks durable, centralized data infrastructure.

Analysts work with several external data sources, including:

- CollegeFootballData / public college football data
- Hudl IQ
- PFF Premium

The current workflow is fragmented and manual:

- analysts repeatedly download or fetch data
- updated CSVs are passed around
- access to certain datasets is difficult to manage formally
- analysis is performed mainly in R, with some Python
- reports are often distributed as PDFs, CSVs, or self-contained HTML files
- long-lived reports need to be rerun manually when new data arrives
- completed work can become scattered across laptops, folders, and email

The long-term goal is to create infrastructure that survives beyond the current generation of student analysts.

Core principle:

> Rice Football analytics work should live in durable shared infrastructure, not individual laptops, emailed CSVs, or one-off files.

---

# 2. Current Repository State

Sprint 1 has been completed and merged into `main`.

The repo originally started as a bare `create-next-app` project, but now contains early foundations such as:

- shared app/layout components
- reusable UI components
- mock football data
- mock API routes
- CSV upload/parsing prototype
- JSON parsing/validation prototype and upload prototype if present after integration
- initial CollegeFootballData exploration/scripts

Before creating new files, inspect the existing codebase and reuse what Sprint 1 already established.

Do not create duplicate versions of:

- the application shell
- navigation
- generic cards
- generic tables
- buttons
- inputs
- mock football structures
- API/client utilities that already exist

If an existing component is close to what you need, extend or wrap it instead of rebuilding it.

---

# 3. Confirmed Client Requirements

We have now met with the Rice Football representative. The following requirements are client-validated and should be treated as current product direction.

## Analyst use cases

Analysts want:

1. **One central place for data**
   - access data from multiple sources
   - reduce reliance on manually passing around updated CSVs
   - formally control who has access to certain data

2. **Report/script publishing**
   - upload self-contained HTML visualizations for one-off or richer reports
   - upload completed PDFs and CSVs into a report library
   - upload R or Python scripts for long-lived reports
   - long-lived reports should eventually be rerunnable against the latest data

3. **Programmatic data access**
   - custom package is desired
   - R is the primary language
   - Python still needs support eventually

## Staff-facing use cases

The staff side should stay simple.

Confirmed needs:

- homepage with conference standings
- Rice schedule
- basic useful information such as records and recent scores when practical
- polished/slick UI so staff actually uses the application
- a place for staff to submit questions to the analytics team
- reports grouped into:
  - Offense
  - Defense
  - Special Teams
  - Player Personnel
- staff/coaches should NOT see analyst script-upload functionality

## Q&A

Staff should be able to submit questions.

The system should identify who submitted a question so analysts can distinguish requests from:

- GMs
- coaches
- other staff

For now, title/role should be visible. Do not build complicated prioritization logic unless explicitly requested.

## Data

The client wants broad access to data across the known sources.

### CollegeFootballData

- accessible
- public/free API/package ecosystem
- useful for schedule, standings, scores, teams, games, and broader college football data

### Hudl IQ

- highest-priority source
- client considers the API annoying to work with
- API credentials are expected/provided
- tracking data is especially important

### PFF

- important long-term source
- programmatic access is currently not working
- PFF is OUT OF SCOPE for Sprint 2
- do not spend Sprint 2 time trying to fix or reverse-engineer PFF access

## Scope of data

The client would like broad college data, not only Rice-specific data.

Do not assume the production database should contain only Rice records.

---

# 4. Current Architecture Direction

The current intended stack is:

- **Next.js** — web application and application server
- **TypeScript** — primary application language
- **Supabase** — planned database/auth/storage platform
- **PostgreSQL** — underlying database
- **R** — primary analyst language
- **Python** — secondary supported analyst/report language
- **GitHub** — source control
- **separate worker later** — likely for R/Python/Quarto-style report execution

Supabase is being set up by the project/architecture lead.

Sprint 2 tasks MUST NOT depend on Supabase being ready.

Developers should use mock data, local fixtures, local state, or existing APIs where required.

## Future conceptual architecture

```text
CollegeFootballData ----\
                         \
Hudl IQ -----------------> ingestion / normalization ---> Supabase Postgres
                         /                                  |
PFF (later) ------------/                                   |
                                                            |
                            -------------------------------+----------------
                            |                                                |
                       R/Python package                                Next.js app
                            |                                                |
                         analysts                                  staff / analysts
                                                                             |
                                                                     report system
                                                                             |
                                                                  PDF / HTML / CSV
```

This is directional. Do not implement unassigned infrastructure.

---

# 5. Development Philosophy

Sprints are approximately **3-hour work sessions**.

Tasks should:

- be independently executable
- avoid blocking on another developer
- be small enough for one meaningful PR
- have clear file ownership
- avoid speculative architecture
- reuse existing Sprint 1 foundations
- avoid broad refactors
- avoid hidden scope expansion

If another developer is working on something you could theoretically use, do not wait for them.

Use fixtures, mock data, temporary local state, or a narrow local stub.

Integration happens after PR review.

---

# 6. Sprint 2 Goal

Sprint 2 should move from generic foundations toward **client-validated product features and real data integrations**.

Sprint 2 has **6 developers**.

Assignments:

1. Staff Homepage MVP
2. CollegeFootballData: Rice Schedule + Conference Standings
3. Hudl IQ API Integration
4. `riceFB` R Package Foundation
5. Analyst Report Library + Upload Prototype
6. Staff Q&A Prototype

PFF is intentionally excluded from this sprint because access is not currently working.

Supabase is intentionally excluded as a dependency because infrastructure setup is being handled separately.

---

# 7. Sprint 2 Shared Rules

## Rule 1: Reuse Sprint 1 work

Do not recreate:

- app shell
- header/sidebar/navigation framework
- generic UI components
- generic upload parsing utilities
- existing mock data structures
- existing CFBD helpers that are already correct

Inspect the repo first.

## Rule 2: Do not depend on another Sprint 2 branch

Use mocks/fixtures during the sprint.

Examples:

- Task 1 uses mock homepage data instead of waiting for Task 2.
- Task 4 uses package fixtures instead of waiting for CFBD/Hudl.
- Task 5 uses local state instead of waiting for Supabase.
- Task 6 uses mock/local state instead of waiting for auth or Supabase.

## Rule 3: Do not add Supabase in Sprint 2 tasks

The project lead is handling infrastructure separately.

## Rule 4: Do not work on PFF

PFF access is currently blocked and is out of scope for this sprint.

## Rule 5: Keep secrets server-side

Never commit API keys.

If a task requires a credential:

- read it from environment variables
- add only the variable name to `.env.example`
- never expose it in client-side code

## Rule 6: Keep PRs narrow

Do not refactor unrelated code.

---

# 8. Task 1 — Staff Homepage MVP

## Goal

Build the first real staff-facing homepage using the frontend foundation from Sprint 1.

The client specifically wants the homepage to be simple, useful, polished, and easy for staff to return to.

Use mock data only.

Do NOT connect to CollegeFootballData during this sprint. Task 2 handles the real data integration separately.

## Build only these three homepage sections

### Rice summary

Show:

- overall record
- conference record
- next opponent
- next game date/time

### Conference standings

Show:

- team
- conference record
- overall record

Make Rice easy to identify in the table.

### Rice schedule

Show:

- opponent
- date/week
- home or away
- result if completed
- upcoming date/time if not completed

## Navigation

If the existing Sprint 1 navigation still contains placeholders, update staff-facing labels to:

```text
Home
Reports
Questions
```

Do not build the Reports or Questions pages as part of this task.

Do not expose analyst-only items such as script upload or data management in staff navigation.

## Suggested files

Create only what is needed:

```text
src/components/home/
  RiceSummary.tsx
  ConferenceStandings.tsx
  RiceSchedule.tsx

src/data/mock/
  home.ts
```

Update:

```text
src/app/page.tsx
```

If Sprint 1 already has an appropriate mock-data file or component location, extend that instead of duplicating it.

## Styling

Use the client-approved direction:

- Rice navy
- gray
- white/light gray
- clean and professional
- not overly dense

Reuse existing Sprint 1 UI components such as `Card`, `Table`, and existing layout components.

## Do not do

Do not add:

- CFBD calls
- Hudl calls
- Supabase
- auth
- report functionality
- question submission
- advanced stats
- new global UI infrastructure unless truly necessary

## Definition of done

`/` shows a clean staff homepage with:

- Rice summary
- conference standings
- Rice schedule

All data is local/mock.

The page reuses Sprint 1 frontend components rather than duplicating them.

---

# 9. Task 2 — CollegeFootballData: Rice Schedule + Conference Standings

## Goal

Turn the Sprint 1 CFBD exploration into two clean reusable functions for the staff homepage.

Do not wrap the entire CollegeFootballData API.

Implement only:

```ts
getRiceSchedule(season)
getConferenceStandings(conference, season)
```

## Suggested files

Reuse/extend existing Sprint 1 CFBD code.

Target structure:

```text
src/lib/cfbd/
  client.ts
  schedule.ts
  standings.ts
  types.ts
```

Save small representative fixtures under:

```text
samples/cfbd/
  rice-schedule.json
  conference-standings.json
```

Do not commit huge API payloads.

## Required interface

Approximately:

```ts
async function getRiceSchedule(
  season: number
): Promise<ScheduleGame[]>
```

```ts
async function getConferenceStandings(
  conference: string,
  season: number
): Promise<ConferenceStanding[]>
```

Return normalized app-friendly data rather than exposing raw vendor objects everywhere.

Suggested schedule type:

```ts
type ScheduleGame = {
  gameId: string;
  week: number;
  opponent: string;
  homeAway: "home" | "away";
  date: string;
  status: "scheduled" | "completed";
  riceScore: number | null;
  opponentScore: number | null;
};
```

Suggested standings type:

```ts
type ConferenceStanding = {
  team: string;
  conferenceWins: number;
  conferenceLosses: number;
  overallWins: number;
  overallLosses: number;
};
```

Adapt these if the real API requires a small change, but keep the public output simple.

## Credentials

If an API key is required, use an environment variable.

Example:

```text
CFBD_API_KEY=
```

Add only the variable name to `.env.example`.

## Error handling

Handle basic failure cases clearly:

- missing credentials
- failed API request
- invalid season
- unexpected response structure

Do not build retry infrastructure.

## Important

Do not modify Task 1's homepage during this sprint.

Test these functions independently.

Integration happens later.

## Do not do

Do not work on:

- Hudl
- PFF
- Supabase
- database insertion
- scheduled ingestion
- plays
- recruiting
- transfer portal data
- generic CFBD SDK design

## Definition of done

A developer can call:

```ts
await getRiceSchedule(2026);
await getConferenceStandings("AAC", 2026);
```

and receive clean TypeScript objects suitable for the homepage.

---

# 10. Task 3 — Hudl IQ API Integration

## Goal

Establish reliable access to Hudl IQ and retrieve representative real data.

Hudl is the client's highest-priority data source.

This sprint is about understanding and accessing the real API, not designing the database.

## First objective

Prove:

```text
our code
  ↓
Hudl authentication
  ↓
Hudl API
  ↓
real response
```

## Suggested files

Prefer TypeScript unless the real API/docs strongly favor Python:

```text
scripts/hudl/
  fetch-sample.ts

src/lib/hudl/
  client.ts
  types.ts
```

If Python is clearly more appropriate:

```text
scripts/hudl/
  client.py
  fetch_sample.py
```

Choose one language only.

## Credentials

Use environment variables matching the real Hudl authentication requirements.

For example:

```text
HUDL_API_KEY=
```

Update `.env.example` with variable names only.

## What to retrieve

Use the actual Hudl documentation/API.

Priority order:

1. games/events
2. players/rosters
3. tracking data

Do not invent endpoint names.

If tracking data requires first obtaining a game/event ID, follow the real API flow.

## Save samples

Store small raw responses under:

```text
samples/hudl/
```

Examples if these concepts exist:

```text
games.json
players.json
tracking.json
```

Preserve raw source responses.

Do not normalize them yet.

## Short documentation

Create:

```text
docs/hudl.md
```

Document only:

- authentication method
- base URL
- endpoints successfully tested
- game identifier
- player identifier
- tracking-record shape
- pagination behavior
- important limitations/errors
- command needed to run the sample fetch

Keep this concise.

## Do not do

Do not:

- create Supabase tables
- insert data into a DB
- normalize tracking data
- map Hudl players to CFBD players
- build UI
- create R package Hudl functions
- attempt PFF work

## Definition of done

We can run a documented command that authenticates with Hudl and retrieves real data.

Representative raw responses exist under `samples/hudl/`.

The short Hudl notes clearly explain the important IDs, data structure, and pagination/access behavior.

---

# 11. Task 4 — `riceFB` R Package Foundation

## Goal

Create the first proper R package for Rice Football analysts.

The client confirmed R is the primary analyst language.

Do not design the package API yourself. Use the exact initial interface below.

No real database or API connection is required this sprint.

## Package location

Create:

```text
packages/riceFB/
```

Suggested structure:

```text
packages/riceFB/
  DESCRIPTION
  NAMESPACE

  R/
    teams.R
    games.R
    schedule.R
    plays.R

  tests/
    testthat/

  README.md
```

Use standard R package tooling such as:

- `usethis`
- `devtools`
- `roxygen2`
- `testthat`

## Implement exactly these exported functions

```r
get_teams()

get_games(season)

get_schedule(team, season)

get_plays(game_id)
```

Do not invent a large package API.

## Intended usage

```r
library(riceFB)

teams <- get_teams()

games <- get_games(2026)

rice_schedule <- get_schedule(
  team = "Rice",
  season = 2026
)

plays <- get_plays("game-1")
```

Return normal R data frames/tibbles.

## Data source for Sprint 2

Use local fixture data only.

Example:

```text
packages/riceFB/
  inst/
    extdata/
      teams.csv
      games.csv
      plays.csv
```

Do not connect to CFBD, Hudl, or Supabase during this sprint.

## Documentation

Use roxygen comments for every exported function.

Document:

- purpose
- arguments
- return value
- basic usage example

README should contain a short package usage example.

## Tests

Add basic tests showing:

- `get_teams()` returns data
- `get_games(season)` filters by season
- `get_schedule(team, season)` filters correctly
- `get_plays(game_id)` returns the requested game's plays

Add straightforward errors for obviously invalid input when practical.

## Do not do

Do not add:

- database credentials
- Supabase
- raw SQL
- CFBD calls
- Hudl calls
- PFF functions
- dozens of additional package functions
- Python package work

## Definition of done

These should work reasonably:

```r
devtools::document()
devtools::test()
devtools::check()
```

The four public functions can be demonstrated against local fixture data.

---

# 12. Task 5 — Analyst Report Library + Upload Prototype

## Goal

Build the first analyst-facing report-management prototype based on the confirmed client workflow.

Analysts need to work with two report types.

### Static reports

Supported types:

- PDF
- CSV
- HTML

### Runnable reports

Supported script types:

- R
- Python

Nothing should execute or persist to cloud storage during this sprint.

## Routes

Create:

```text
/analyst/reports
/analyst/reports/upload
```

Suggested files:

```text
src/app/analyst/reports/page.tsx
src/app/analyst/reports/upload/page.tsx
```

## Components

Suggested:

```text
src/components/reports/
  ReportCard.tsx
  ReportCategoryTabs.tsx
  ReportUploadForm.tsx
```

Reuse Sprint 1 UI components.

## Client-confirmed categories

Use exactly:

```ts
type ReportCategory =
  | "offense"
  | "defense"
  | "special-teams"
  | "player-personnel";
```

## Report kinds

```ts
type ReportKind =
  | "static"
  | "runnable";
```

## File types

Static:

```text
.pdf
.csv
.html
```

Runnable:

```text
.R
.py
```

## Suggested report type

Create:

```text
src/types/report.ts
```

Example:

```ts
export type Report = {
  id: string;
  name: string;
  description: string;
  category: ReportCategory;
  kind: ReportKind;
  fileType: string;
  createdAt: string;
};
```

This is not the final database model.

## Mock reports

Create:

```text
src/data/mock/reports.ts
```

The library should allow analysts to view/filter reports by:

- Offense
- Defense
- Special Teams
- Player Personnel

Visually distinguish static versus runnable reports.

## Upload form

Collect:

- report name
- description
- category
- report kind
- file

Validate extension based on selected type.

Examples:

```text
static + .pdf   -> valid
static + .html  -> valid
runnable + .R   -> valid
runnable + .py  -> valid
runnable + .pdf -> invalid
```

Submitting may add metadata to local React state or show a success state.

It does not need to survive refresh.

## Important

This is analyst-only functionality.

Do not expose script upload in the staff-facing navigation.

## Do not do

Do not:

- add Supabase Storage
- upload to a real server
- execute R/Python
- create workers
- add versioning
- build staff-side report generation
- work on PFF

## Definition of done

A developer can:

1. open the analyst report library
2. filter mock reports by category
3. go to Upload Report
4. choose static or runnable
5. enter metadata
6. select a valid file
7. submit and see success

---

# 13. Task 6 — Staff Q&A Prototype

## Goal

Build the Q&A workflow requested by the client.

Staff need a simple way to send questions to analysts.

Analysts need to see who asked, their role/title, the question, submission time, and status.

No real authentication or persistence is required yet.

## Routes

Create:

```text
/questions
/analyst/questions
```

Suggested files:

```text
src/app/questions/page.tsx
src/app/analyst/questions/page.tsx
```

## Staff-facing page

Provide a simple form:

```text
Ask the Analytics Team

Your Name
[__________]

Role / Title
[__________]

Question
[________________________]
[________________________]

[Submit Question]
```

In production, user identity will eventually come from authentication.

For now, manual entry is acceptable.

After submission, show clear success feedback.

## Analyst-facing page

Show incoming questions with:

- submitter name
- role/title
- question
- submitted time
- status

Use statuses:

```ts
type QuestionStatus =
  | "open"
  | "in-progress"
  | "answered";
```

Allow analysts to change status locally.

## Data type

Create:

```text
src/types/question.ts
```

Example:

```ts
export type Question = {
  id: string;
  submittedBy: string;
  submitterTitle: string;
  text: string;
  status: "open" | "in-progress" | "answered";
  createdAt: string;
};
```

## Mock questions

Create:

```text
src/data/mock/questions.ts
```

Include examples with titles such as:

- GM
- Coach
- Staff

Do not create complicated priority scoring.

The title simply needs to be visible so analysts can identify important requesters.

## Persistence

Use mock data/local state only.

It is acceptable if newly submitted questions disappear after refresh.

## Do not do

Do not add:

- Supabase
- auth
- email
- Slack integration
- notifications
- threaded conversations
- attachments
- analyst assignment
- full ticketing-system functionality

## Definition of done

Staff can submit a question through a clean form.

Analysts can view representative questions with submitter identity/title and can update their status among:

- open
- in-progress
- answered

---

# 14. Sprint 2 File Ownership

Avoid unnecessary overlap.

## Task 1 owns

```text
src/components/home/
src/data/mock/home.ts
src/app/page.tsx
```

May make a small edit to the existing navigation component if needed.

## Task 2 owns

```text
src/lib/cfbd/
samples/cfbd/
```

May add a CFBD environment-variable name to `.env.example`.

## Task 3 owns

```text
src/lib/hudl/
scripts/hudl/
samples/hudl/
docs/hudl.md
```

May add Hudl environment-variable names to `.env.example`.

## Task 4 owns

```text
packages/riceFB/
```

## Task 5 owns

```text
src/app/analyst/reports/
src/components/reports/
src/types/report.ts
src/data/mock/reports.ts
```

## Task 6 owns

```text
src/app/questions/
src/app/analyst/questions/
src/types/question.ts
src/data/mock/questions.ts
```

---

# 15. Merge Conflict Avoidance

Shared conflict-prone files include:

```text
package.json
package-lock.json
.env.example
src/app/layout.tsx
src/app/page.tsx
```

Only edit them when necessary.

If adding a dependency:

- keep it minimal
- do not add large libraries without clear need

Do not refactor unrelated files.

---

# 16. What NOT to Build in Sprint 2

Do not spend Sprint 2 building:

- PFF integration
- Supabase integration
- production DB schema
- production auth
- analyst/staff permission enforcement
- worker infrastructure
- background queues
- report execution
- Quarto execution
- R Markdown execution
- report versioning
- PDF generation
- production file storage
- player identity matching
- full ingestion pipelines
- scheduled ETL jobs
- Python analyst package
- MCP/AI features

These are later-phase concerns.

---

# 17. Data Design Principles for Later

Do not fully implement these yet, but preserve these principles.

## Preserve source provenance

If multiple vendors provide similar data, do not silently overwrite one source with another.

We should eventually be able to know:

```text
value
source
time/version
```

## Separate internal identity from vendor identity

Eventually:

```text
CFBD player ID
Hudl player ID
PFF player ID
```

may refer to one real player.

A future system may require internal IDs plus source-specific external IDs.

Do not lock in the exact schema yet.

## Prefer stable analyst-facing interfaces

The eventual R/Python package should shield analysts from raw vendor schemas and database changes.

---

# 18. Coding Guidance

## General

Prefer:

- simple code
- explicit code
- small functions
- clear names
- TypeScript types
- reusable existing components
- readable errors
- isolated vendor-specific code

Avoid:

- speculative abstraction
- broad refactors
- unnecessary frameworks
- building infrastructure not assigned to you
- duplicating Sprint 1 work

## Next.js

Follow the existing project structure.

If the app uses `src/app/`, keep using it.

If the repo uses `app/` without `src`, adapt the paths in this document rather than moving the whole project.

## Secrets

External API secrets must remain server-side.

Never expose API keys, vendor credentials, or future database credentials to browser code.

Never commit real credentials.

---

# 19. Pull Request Expectations

Each developer should aim for one focused PR.

Include:

- clear title
- short summary
- how to test
- known limitations
- screenshots for UI work

Example:

```text
Title:
Build staff homepage MVP

What changed:
- Added Rice summary
- Added mock conference standings
- Added mock Rice schedule

How to test:
1. npm install
2. npm run dev
3. open /

Notes:
- currently uses mock data
- real CFBD integration is handled separately
```

---

# 20. Definition of Sprint 2 Success

Sprint 2 is successful if the team finishes independent building blocks in these areas:

```text
STAFF PRODUCT
  - staff homepage
  - Q&A

REAL DATA
  - CFBD schedule/standings functions
  - working Hudl access + raw samples

ANALYST TOOLING
  - riceFB R package foundation
  - report library/upload prototype
```

It is not necessary for all six pieces to be integrated together by the end of the 3-hour session.

The project lead will handle infrastructure and integration planning separately.

---

# 21. Current Product Principle

When making a decision during Sprint 2, ask:

> Is this required by my ticket or directly supported by the client's confirmed requirements?

If not, do not expand scope.

When uncertain:

- use the simplest local implementation
- do not invent new product requirements
- do not redesign the architecture
- ask the project lead if a product-level decision is required

---

# 22. Source of Truth

This `AGENTS.md` is the primary project-context document for coding agents working in this repository.

If a newer explicit decision from the project lead conflicts with this file:

1. follow the newer explicit decision
2. update this document afterward

Do not silently invent stakeholder requirements.


<!-- BEGIN:nextjs-agent-rules -->



**# This is NOT the Next.js you know**



This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in \`node_modules/next/dist/docs/\` (resolved from this file's directory; in monorepos the \`next\` package may not be visible from the repo root) before writing any code. Heed deprecation notices.



This block is written and re-added by \`next dev\` — verify at \`node_modules/next/dist/server/lib/generate-agent-files.js\`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.



\<!-- END:nextjs-agent-rules -->
