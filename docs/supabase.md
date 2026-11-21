# Supabase

The Staff Q&A pages store questions in the `public.questions` Supabase table:

- `/questions`: staff submit questions and see every question's status and answer.
- `/analyst/questions`: analysts change statuses and save answers.

The browser calls our API routes (`/api/questions`). Only the server talks to Supabase, using `SUPABASE_SECRET_KEY`; POST and PATCH request bodies are validated. Each API request verifies the Supabase session and applies the Q&A role rules below before using this secret key. Use only fictional/test data in the approved development project. This narrow authorization layer is not a general production access-control system.

## Environment variables

For local development, copy `.env.example` to `.env.local`, fill in the values from the approved Supabase project, and restart `npm run dev`:

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL. Used by the server-side Q&A helper. |
| `SUPABASE_SECRET_KEY` | Server-only secret used by the Q&A API. It bypasses Row Level Security; never expose it with a `NEXT_PUBLIC_` prefix or commit its value. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public by design, but not used by the current Q&A pages. |

Never paste secret values into source files, docs, chat, or issue reports. `.env.example` contains variable names with empty values only.

## Database setup

The reviewed development database has the following table shape:

| Column | Type | Nullability / default |
| --- | --- | --- |
| `id` | `uuid` | Not null; primary key. The app expects the database to generate it on insert; verify the target table's default. |
| `submitter_name` | `text` | Not null |
| `submitter_title` | `text` | Not null |
| `question` | `text` | Not null |
| `answer` | `text` | Nullable |
| `status` | `text` | Not null; defaults to `open`; check allows `open`, `in-progress`, `answered` |
| `created_at` | `timestamptz` | Not null; defaults to `now()` |
| `updated_at` | `timestamptz` | Not null; defaults to `now()` and is refreshed by an existing update trigger |

The development project was inspected read-only on 2026-11-07; that inspection recorded a numeric `id` key. The current schema clarification is that the column is again named `id` but is UUID-typed. The earlier RLS, grants, and trigger observations were not reverified after this schema change and must not be assumed for another target project.

### Setup procedure

1. Select the intended development Supabase project and confirm it is approved for fictional/test data.
2. Inspect the existing `public.questions` schema, constraints, RLS policies, triggers, and effective role privileges before applying any SQL. Do not query or export real question text for setup verification.
3. Review [`supabase/questions_setup.sql`](../supabase/questions_setup.sql). It is a draft setup file, not application code, and it has not been applied to the hosted project. It creates the table if absent; for an existing table it checks expected columns, UUID default, and key constraints, then stops rather than migrating an incompatible schema. It enables RLS and applies the server-role grants. It does not drop, truncate, or delete table rows.
4. If `public.questions` already matches and has the required access configuration, there is no need to run the setup SQL. If it is absent or differs, review the effects with the database owner before running or adapting the SQL. Back up according to team practice and preserve existing data. Never use a destructive reset to make the setup pass.
5. After an approved setup, re-inspect schema, policies, triggers, and privileges before connecting the app. Do not add a public/anonymous policy to make the frontend work; the current frontend uses server API routes.

The setup file does not establish authentication, authorization, production-safe access controls, or a full migration process. Database RLS alone does not protect API routes that use a server secret key without checking the caller.

### Sample data

[`supabase/seed.sql`](../supabase/seed.sql) inserts fictional sample rows and is optional. It is not required for schema setup, and running it more than once can insert duplicates. Do not run it against a database containing real questions. It contains no reset instruction; never truncate or delete existing questions as part of setup.

## API

### Q&A permissions

The account level is read from trusted Supabase `app_metadata.access_level`, not from a request body or browser-controlled profile field.

| Account level | Read questions / submit | Answer / change status |
| --- | --- | --- |
| Coach (`coach`) | Yes | No |
| Front office (`front_office`) | Yes | No |
| Full analyst (`analyst_full`) | Yes | Yes |
| Limited analyst (`analyst_limited`) | Yes | Yes |
| Signed out or unknown level | No | No |

`src/lib/auth/authorization.ts` defines the Q&A allowlists and `authorizeAccess()`. Protected API handlers and the server-side `/analyst/questions` layout call `getCurrentUser()` and apply the appropriate allowlist. Do not rely on hidden controls or proxy session refresh for authorization. The name and role/title entered with a question remain manually entered Q&A metadata; they are not derived from or asserted as the authenticated shared account identity. The database primary key and API `id` property are UUID strings.

| Request | Body | Response |
| --- | --- | --- |
| `GET /api/questions` | none | `{ questions }`, newest first |
| `POST /api/questions` | `{ submittedBy, submitterTitle, text }` | `201 { question }`, always `open` with no answer |
| `PATCH /api/questions/[id]` | `{ status?, answer? }`, at least one | `{ question }`, or `404` if the id doesn't exist |

Requests without a valid session get `401 { error }`. A signed-in account without the required Q&A access level gets `403 { error }`; this includes unknown access levels and staff attempting to update a question. If the session cannot be verified because the auth service is unavailable, the API returns `503 { error }` and does not access the questions database. Invalid authorized requests get `400 { error, fieldErrors }`; missing question IDs on PATCH get `404 { error }`. Database errors currently get `500 { error }`, with details in the server log.

The analyst questions page performs its own server-side analyst check. Signed-out users are redirected to `/login`; staff or unavailable-session requests see an access/error state instead of the analyst interface. `src/proxy.ts` refreshes sessions for the Q&A pages and API routes, but each server page/API handler remains responsible for authorization.

The application currently enforces maximum lengths of 100 characters for submitter name and title, and 2,000 characters for question and answer. New questions are created with status `open` and no answer. Saving a non-empty analyst answer also sets status to `answered`; clearing an answer leaves status unchanged.

## Manual workflow check

**Verified 2026-11-07 against the approved development project** using the local app and fictional data, before Q&A authorization was added. A question submitted from `/questions` appeared in `/analyst/questions`; the analyst changed its status, saved an answer, edited the answer, and refreshed. The final `answered` status and edited answer remained visible after refresh in the analyst page and in a separate isolated browser context on `/questions`. This confirms persistence through the shared Supabase-backed API. The isolated context used the same browser engine, not a separately installed browser product. It does not verify the role checks described above.

Loading, empty-list, and saved-feedback states were also checked. Mocked API responses exercised the staff load-error/retry state and analyst status-save and answer-save error feedback in isolated browser contexts; these checks did not make database writes. `npm run lint` and `npm run build` both passed. No real configuration or database-permission failure was induced.

**Authorization verification performed 2026-11-14 against the local app.** Direct logged-out GET, POST, and PATCH requests returned 401. With a front-office session, GET returned 200, an empty POST body reached validation and returned 400, PATCH returned 403, and `/analyst/questions` rendered an access-restricted state. With analyst-limited, GET and `/analyst/questions` returned 200, and an empty PATCH body reached validation and returned 400. With analyst-full, GET and `/analyst/questions` returned 200, and empty POST/PATCH bodies reached validation and returned 400. A fictional test question was submitted (201), answered and marked answered (PATCH 200), and re-read to confirm persistence; it was then reset to status `open` with a null answer. Because the API has no delete operation, that test row remained after the check; its current ID and state have not been rechecked after the UUID schema update. The local Supabase project target was not independently inspected during this check, so these results apply to the project configured for that local app only. The successful production build and lint checks were also rerun on 2026-11-14.
