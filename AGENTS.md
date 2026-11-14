# AGENTS.md

## Rice Football Analytics Platform

Updated: November 7, 2026.

This is the primary project-context document for developers and coding agents.
Read it before making implementation decisions. Newer explicit instructions from
the project lead take precedence; update this document when decisions change.

## 1. Mission and stack

Build durable shared infrastructure for Rice University Football analytics so
work does not remain scattered across laptops, emailed CSVs, and one-off reports.

The intended stack is Next.js, TypeScript, Supabase/PostgreSQL, and an R package.
R is the primary analyst language; Python support is a future concern. Separate
report-execution workers may be added later. These directions do not authorize
unassigned infrastructure work.

Staff need a simple, professional product. Analysts need reusable data access,
clear documentation, and report management. Use Rice navy, gray, and white/light
gray. Reuse existing styles and components.

## 2. Actual repository state

Sprint 1 foundations and the subsequent homepage, reports, Hudl, R package, and
Supabase Q&A branches are merged. Inspect the code rather than assuming all
features are production-ready.

| Area | Current implementation | Important limit |
| --- | --- | --- |
| Homepage | Server-side CFBD schedule/standings and derived Rice summary | Development uses labeled mock fallback on failure; production shows unavailable sections; hourly revalidation |
| CFBD | Real client, normalized schedule/standings functions, exploration scripts, saved samples | No centralized football database or ingestion pipeline |
| Hudl IQ | Real API client and sample fetcher for games, players, plays, tracking | Standalone exploration; no app/database integration; some tracking downloads return 403 |
| PFF | Lead/agent verified authentication and NCAA franchises access | No reusable PFF integration committed at this baseline |
| Staff reports | Category-filtered static library with local sample files | Fictional metadata and sample content |
| Analyst reports | Mock static/runnable library and upload form | Upload captures metadata in local React state; no file storage, execution, or insertion into the library |
| Q&A | Next.js API routes read/write Supabase questions and answers | Hosted end-to-end workflow needs verification; no authentication/authorization |
| riceFB | Four exported functions reading bundled CSVs | Fixtures only; no vendor/database connection |
| Mock API routes | Return shared local arrays | Entirely mock |
| CSV/JSON previews | Parse user-selected files locally in browser | No server upload or persistence |
| Login, news, tags/search, dictionary | Not implemented at this baseline | Assigned below |

Real API samples are different from invented fixtures. Preserve that distinction
in labels and documentation. Hudl raw responses are Git-ignored. The current
Q&A code expects a real table, but a table used for a prototype is not proof of an
approved production schema. The repo currently has Q&A seed SQL, not a complete
reproducible table-creation migration.

Do not describe the football database, permissions model, or ingestion design as
finalized. Existing TypeScript types describe app outputs, vendor fields, or mock
records; they do not establish an official database schema.

## 3. Latest client direction

### Staff product

- Current homepage football information is sufficient for now.
- Staff reports use Offense, Defense, Special Teams, Player Personnel categories.
- Staff can submit questions and see answers from analysts.
- Staff should not see analyst script-upload controls or runnable report entries.
- News about the next opponent belongs on the homepage.
- A separate News page should cover conference/general, recruiting, and transfer
  portal news, including relevant injuries and staffing changes.
- Player identity and the date of commitments/portal events matter when known;
  publication time and event time are distinct.
- Notifications for important releases are desired later; delivery and rules are
  not decided.

### Analyst tooling

- Analysts want documentation for available structures, columns, identifiers,
  meanings, and package usage.
- Analysts should tag reports; staff should search by keywords/tags.
- Natural-language AI search is lower priority and not assigned this sprint.

### Data and accounts

- Retain separate source-specific data structures; avoid one giant combined table.
- Combined game-level views may eventually fill coverage gaps.
- Prefer PFF over CFBD where equivalent information overlaps, preserving source
  provenance. This precedence is client direction, not implemented merge logic.
- PFF access is now verified for authentication and franchises. The old blanket
  prohibition on PFF work is superseded by Task 1 below.
- Coach/front office access is intended to be equivalent initially.
- Full and restricted analyst access are desired. Dataset/action restrictions and
  whether client login counts describe accounts or permission levels still need
  lead decisions. Do not invent those rules.

## 4. Current sprint rules

Six developers, approximately three-hour sessions, one focused PR each.

- Work independently from current main; do not wait for another sprint branch.
- Use existing components, APIs, types, and helpers wherever possible.
- Use fixtures for explicitly assigned prototypes and label them clearly.
- The lead owns news-source selection, access research, collection strategy, and
  unverified PFF endpoint selection. Do not turn these into developer research tasks.
- Supabase work is authorized for Q&A reproducibility and the narrow login
  foundation below. This supersedes the old Sprint 2 blanket restrictions.
- No final football schema, ingestion system, or broad access-control rollout is
  authorized by these tasks.
- Lead supplies access and decisions needed for hosted setup and auth before
  dependent work. While waiting, finish independent code/docs/checks and report
  the specific blocker; do not claim unverified behavior works.

## 5. Task 1 — Reusable PFF client

### Goal

Turn the verified manual authentication and franchise requests into reusable code.

### Build

- Read PFF_API_KEY only in server/script code.
- POST https://api.profootballfocus.com/auth/login using the x-api-key header.
- Extract the returned JWT without logging it.
- GET https://api.profootballfocus.com/v1/ncaa/franchises using Authorization:
  Bearer <JWT>.
- Reuse the token within a script run; no persistent token store or retry system.
- Handle missing keys, failed auth/requests, and unexpected response structures.
- Add a sample command printing a concise summary and Rice's franchise ID.
- Document authentication, verified fields, command, and limitations.
- Add only the variable name to .env.example. Keep tokens and restricted payloads
  out of Git; ignore local raw output if saving it is necessary.

### Ownership

src/lib/pff/, scripts/pff/, docs/pff.md, optional samples/pff/ README.
Small .env.example/.gitignore changes are allowed if necessary.

### Done

Another developer can retrieve franchises with one command without copying a JWT.
Invalid credentials produce a readable error without secret exposure.

### Exclude

Additional endpoint discovery, game/player retrieval unless supplied and explicitly
assigned by the lead, database insertion, scheduled ingestion, vendor matching.

## 6. Task 2 — Verify and complete Supabase Q&A

### Goal

Make the existing hosted Q&A workflow reproducible and verify it end to end.

### Build

- Inspect the development questions table using lead-provided access.
- Add reviewed SQL setup matching existing code: expected fields, defaults,
  allowed statuses, constraints, and required access settings.
- Document setup safely for existing data; do not drop/reset tables or overwrite
  real records. Do not automatically alter an existing incompatible table.
- Verify submission, listing, status updates, answer editing, and staff viewing
  across two browsers and refreshes using fictional data.
- Fix workflow failures and provide readable configuration/database error states.
- Record what was tested and any hosted-state limitations.

### Ownership

src/app/questions/, src/app/analyst/questions/, src/app/api/questions/,
src/components/questions/, src/lib/questions/, src/types/question.ts,
Q&A SQL under supabase/, docs/supabase.md. Small Q&A README updates allowed.

### Done

A submitted question and analyst answer persist and appear in another browser.
A developer can reproduce setup from documentation.

### Exclude

Auth integration, notifications, threads, attachments, assignments, unrelated
schemas, destructive resets. Current APIs have no user authorization; use fictional
data and do not describe this as a production-secure workflow.

## 7. Task 3 — Report tags and keyword search

### Goal

Extend existing libraries and upload metadata using their current mock architecture.

### Build

- Add tags: string[] to Report and representative tags to fixtures.
- Add a simple tag input to the existing upload form.
- Trim tags, deduplicate case-insensitively, and enforce clear count/length limits.
- Show tags on cards and the upload success preview.
- Search names, descriptions, tags case-insensitively in both libraries.
- Combine search with category filtering; add clear/reset and no-match feedback.
- Keep runnable reports excluded from staff results.

### Ownership

src/types/report.ts, src/data/mock/reports.ts, src/components/reports/,
src/app/reports/, src/app/analyst/reports/.

### Done

Search finds tagged fixtures; filters compose; upload success shows cleaned tags.

### Exclude

Supabase reports, file storage, execution, AI search, and making submitted reports
appear in libraries. The existing upload only shows local success metadata.

## 8. Task 4 — News interface prototype

### Goal

Validate presentation without requiring real news sources or collection research.

### Build

- Create a small fictional news type/fixture collection with headline, source
  label, optional source URL, publication time, team, and topic.
- Include injuries, staffing changes, commitments, and portal examples. Optional
  player/event dates must be labeled distinctly from publication dates.
- Create /news with general/conference, recruiting, and portal filters.
- Show newest first with source attribution and readable dates.
- Add a homepage panel using the existing schedule to identify the next opponent
  and match fixtures. Do not add another CFBD client or separate schedule request.
- Handle no upcoming game, unavailable schedule, and no matching stories.
- Add News to navigation and label all fictional content as sample data.
- Omit external links for fictional items or use clearly inert placeholders;
  never fabricate article URLs on real publisher sites.

### Ownership

src/app/news/, src/components/news/, news types and fixtures; small edits to
src/app/page.tsx and existing shared navigation/header/sidebar as needed.

### Done

Users can browse/filter fixtures; homepage shows next-opponent matches only.
No real sources are required to complete this task.

### Exclude

Source selection/research, scraping, social APIs, automated collection, notifications,
AI summaries. The lead handles sourcing separately.

## 9. Task 5 — Analyst data dictionary

### Goal

Explain existing structures without presenting them as an official database design.

### Build

- Create /analyst/data-dictionary with a local catalog.
- Cover CFBD schedule/standings outputs, Hudl tracking, and riceFB teams/games/plays
  fixture columns.
- Show purpose, source, field types/meanings, identifiers, known nullability and
  limitations. Distinguish API output, raw vendor payload, and package fixture.
- Search structure names, field names, descriptions.
- Mark unknown units/meanings as unverified; do not infer undocumented semantics.
- Link existing package usage docs and explain how to add catalog entries.

### Ownership

src/app/analyst/data-dictionary/, dictionary components/catalog, supporting docs.
Use a direct route during the sprint; no shared navigation edit required.

### Done

An analyst can search a field and see its source, meaning, and prototype status.

### Exclude

New tables, final schema design, introspection, vendor normalization, dependencies
on this sprint's PFF work, and package implementation changes.

## 10. Task 6 — Supabase login/session foundation

### Goal

Establish verified identity on a narrow protected account page before later
permission enforcement across the product.

### Lead prerequisites

Provide provisioned email/password test accounts and approve trusted access-level
storage. Users must not be able to edit their own access level. Do not invent full
versus restricted analyst privileges.

### Build

- Add /login and /account with login/logout and useful failure feedback.
- Use current Supabase-supported session handling for the installed Next.js version.
- Restore sessions after refresh; handle expired sessions.
- Add a server-side helper verifying the current user.
- Protect /account on the server and display the verified identity and trusted
  access-level value. Client-only hiding is insufficient.
- Document provisioning, configuration, tests, and remaining authorization work.
- Prioritize session correctness and server verification over visual polish.

### Ownership

src/app/login/, src/app/account/, focused auth components/helpers, docs/auth.md,
minimal auth-specific SQL if approved. A minimal dependency addition for supported
session handling is allowed when required; explain it in the PR.

### Done

A provisioned user logs in, refreshes, sees /account, and logs out. Direct access
without a valid session is rejected.

### Exclude

Signup, reset-password/invitation/admin UI, full app protection, Q&A API changes,
dataset permissions, production RBAC. Login alone does not secure existing APIs.

## 11. Coordination and file ownership

- Task 4 owns shared navigation edits; others use direct routes for new pages.
- Tasks 2 and 6 remain independent. Q&A verification must not wait for auth.
  Connecting auth permissions to Q&A is later assigned integration work.
- Task 5 uses committed structures; it must not wait for Task 1.
- Avoid unrelated changes to package.json, package-lock.json, .env.example,
  src/app/layout.tsx, src/app/globals.css, and src/app/page.tsx.
- Shared environment additions must preserve other developers' variable names.
- No broad refactors, duplicate app shells, generic cards/tables/buttons, mock
  football structures, parsers, or API utilities.

## 12. Future architecture boundaries

A central football database is not built or finalized. Do not create final teams,
players, games, plays, tracking, external-ID, report, or execution schemas without
an explicit assignment and lead decisions based on real payloads.

Preserve source provenance and raw/vendor distinctions. Vendor player/team IDs are
not interchangeable. Eventual internal identities should remain separate from
source-specific IDs. The future R/Python interfaces should shield analysts from
vendor and database schema changes.

Not assigned this sprint: football ingestion/ETL, scheduled jobs, source precedence
implementation, identity matching, production report storage, script execution,
workers/queues, Quarto/R Markdown, PDF generation, Python package, news collection,
notifications, AI search, or full authorization rollout.

## 13. Engineering, secrets, and verification

- Prefer explicit TypeScript, small functions, readable errors, existing patterns.
- Follow src/app/ structure and read relevant installed Next.js guides before
  changing framework-specific code.
- Never commit real .env files, API keys, JWTs, database secrets, or signed URLs.
  Only variable names and empty placeholders belong in .env.example.
- Keep vendor keys and Supabase secret keys server-side. A server route using a
  privileged key still needs user authorization when that is later implemented.
- Never claim hosted state, credentials, policies, or live behavior were verified
  solely because the build passes or documentation says so.
- Use Node 22+ and run appropriate checks: npm run lint, npm run build, TypeScript
  checks as needed, focused validation/API tests, and relevant UI interaction checks.
- For live vendor requests, keep queries small. Do not publish restricted payloads.
- Keep PRs focused: concrete summary, how to test, actual validation, limitations,
  screenshots for UI work, setup/environment changes without credentials.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
