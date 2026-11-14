# PFF API client

Verified against the live API on 7 November 2026.

## Run

Use Node 22+ and install the repository dependencies with `npm ci`.
Add your key to the ignored `.env.local` as `PFF_API_KEY=your_key`, preserving
existing entries. `.env.example` contains only the empty placeholder.

From the repository root:

```bash
npx tsx --env-file=.env.local scripts/pff/fetch-franchises.ts
```

The verified run printed:

```text
Retrieved 504 NCAA franchise records.
Rice Owls franchise ID: 275
```

Counts can change. The script finds Rice Owls by name and fails if there is not
exactly one match. It prints a summary without saving raw responses or tokens.

## Authentication and reuse

Base URL: `https://api.profootballfocus.com`.

`createPffClient()` sends `POST /auth/login` with `x-api-key: <PFF_API_KEY>`.
The response is a JSON object containing `jwt`. The client keeps that token in
memory and sends `Authorization: Bearer <jwt>` to `GET /v1/ncaa/franchises`.
Create one client per script run and reuse it:

```ts
const client = await createPffClient();
const franchises = await client.getFranchises();
```

Further calls to this client's `getFranchises()` reuse the token, including
concurrent calls. There is no token file, automatic refresh or retry. If a token
expires, start a new run/client. Import `src/lib/pff/client.ts` only in Node server
or script code; its Node import prevents use in browser components.

## Returned fields

The endpoint returns `{ franchises: [...], leagues: [...] }`.
`getFranchises()` validates and returns the `franchises` array without normalizing
vendor fields. It does not return the accompanying `leagues` metadata.

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | integer | PFF franchise identifier; Rice Owls was `275` |
| `name` | string | Franchise name |
| `league_id` | integer | PFF league identifier |
| `league` | string | League label |
| `sportradar_id` | string or null | Nullable vendor field, returned unchanged |

These are PFF identifiers, not internal, Hudl or CFBD IDs. Account coverage,
pagination and rate limits have not been established by this sample.

## Errors and checks

Missing keys, failed HTTP requests, network failures and unexpected JSON/token/
franchise structures produce readable errors. Requests time out after 30 seconds
and reject redirects. Error messages exclude response bodies, keys and JWTs.
The sample command exits with status 1 on failure.

```bash
npx tsx --test scripts/pff/client.test.ts
```

The tests use fictional responses and need no key. Only authentication and NCAA
franchises are implemented; additional endpoints, database ingestion, scheduling
and cross-vendor matching are outside this task.

Reference: [PFF master data documentation](https://api.profootballfocus.com/doc/master-data)
(requires sign-in). Field structure above was checked against live responses.
