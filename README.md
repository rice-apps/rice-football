# Rice Football Analytics

Sprint 1 foundations: a reusable app shell, typed mock data and APIs, generic CSV/JSON preview tools, and isolated CFBD exploration scripts. Product workflows remain provisional.

## Local development

Use Node.js 22 or newer (`nvm use` reads `.nvmrc`).

```bash
npm ci
npm run dev
```

Open http://localhost:3000. The app runs without credentials.

Development prototypes:

- `/dev/mock-api`: fetch and display shared mock teams.
- `/dev/csv-upload`: choose or drop a CSV; preview headers and up to 50 rows. Try the fixtures in `samples/csv/`.
- `/dev/json-upload`: choose a JSON object or an array of objects; validate structure and preview up to 20 records / 20,000 characters.

Both file prototypes read files locally in the browser, accept files up to 5 MB, and do not persist data. JSON field schemas can be checked separately with `validateJson`; the generic upload page does not impose a vendor schema.

## Integration checks

```bash
npm run lint
npm run build
npx tsc --noEmit
```

With `npm run dev` running, visit `/` and all three `/dev/` pages. On the upload pages, try valid input, empty files, wrong extensions, malformed syntax, and invalid structures. CSV issues should preserve usable rows; JSON expects an object or an array of objects.

The following endpoints return arrays imported from `src/data/mock/`:

- `GET /api/mock/teams` — 7 teams
- `GET /api/mock/players` — 25 players
- `GET /api/mock/games` — 4 games
- `GET /api/mock/plays` — 49 plays

## CFBD exploration

CFBD is independent of application startup and builds. To run a script, copy `.env.example` to `.env.local`, set `CFBD_API_KEY` locally, then run:

```bash
npx tsx --env-file=.env.local scripts/cfbd/fetchTeams.ts
npx tsx --env-file=.env.local scripts/cfbd/fetchGames.ts
npx tsx --env-file=.env.local scripts/cfbd/fetchPlays.ts
```

Scripts make real API requests and overwrite the corresponding sample files with up to 25 records. Never commit credentials or populated `.env` files. See [CFBD notes](samples/cfbd/README.md) for sample queries and field details.
