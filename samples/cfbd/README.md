# CFBD Data

The API provided by CFBD is well-defined and documented [here](https://api.collegefootballdata.com/), although an API key is required for use (`CFBD_API_KEY`). Copy `.env.example` to `.env.local` and put the key (given in Slack) there. CFBD also offers an SDK `cfbd` that has been integrated into the project. The SDK simplifies querying by wrapping the actual HTTP requests, and it provides TypeScript types for both the query parameters and the responses.

The scripts fetching the data can be run individually by `npx tsx --env-file=.env.local scripts/cfbd/{SCRIPT_NAME}.ts`, or imported and use them elsewhere.

## What's in the samples

Each sample is cut down to the first 25 records by `saveSample` and are just there to show the shape of the data, not the complete data.

| File | Query | Full response |
| --- | --- | --- |
| `teams.json` | `{ year: 2024 }` | 677 teams |
| `games.json` | `{ year: 2024, team: 'Rice' }` | 12 games |
| `plays.json` | `{ year: 2024, week: 1, team: 'Rice' }` | 174 plays |

## Important identifiers and fields

### Teams

- `id` is a number and it's the team's CFBD ID (Rice is `242`). This is the same ID used in `homeId` / `awayId` on games, and the logo URLs are built off of it too.
- `school` is the display name (`"Rice"`), and this is what the API actually wants when you filter by team, not the ID.
- There's also `abbreviation`, `alternateNames`, `mascot`, `conference`, and `classification` (`"fbs"`, `"fcs"`, etc.), which could be helpful for matching against other vendors later.
- `location` is the home venue, and it has its own `id` which matches up with `venueId` on games.

### Games

- `id` is a number (e.g. `401641039`), and it looks like an ESPN-style game ID. This is what plays use for their `gameId`.
- `season` is just the year, `week` is a number, and `seasonType` is `"regular"` or `"postseason"`. Weeks are numbered on the calendar, so bye weeks just show up as gaps (Rice has no week 6 or week 12 game in 2024).
- Teams show up as both an ID and a name: `homeId` / `homeTeam` and `awayId` / `awayTeam`. Same deal with `homeConference`, `homePoints`, `homeLineScores` (points per quarter), etc. on both sides.
- There's also `startDate` (ISO timestamp), `completed`, `neutralSite`, `conferenceGame`, `venueId` / `venue`, plus some extra CFBD stuff like Elo and win probability.

### Plays

- `id` is a **string** (e.g. `"401641039101854601"`), not a number, and it starts with the `gameId`.
- `gameId` links back to the game (number), and `driveId` is also a string, which is just the `gameId` with the `driveNumber` tacked on the end (`"4016410391"` is drive 1 of game `401641039`).
- `driveNumber` and `playNumber` give the order of the play within the game.
- Offense and defense are **names only** (`offense: "Sam Houston"`, `defense: "Rice"`), there are no team IDs on plays. Same thing for `home` / `away`. So matching plays to teams means going through the name, or going through `gameId` to the game and grabbing the IDs from there.
- The situation is described by `period`, `clock` (`{ minutes, seconds }`), `down`, `distance`, `yardline`, `yardsToGoal`, and the score/timeouts for each side.
- The result is `yardsGained`, `scoring`, `playType` (a string like `"Rush"` or `"Pass Reception"`), and `playText`, which is the human-readable description.
- `ppa` (CFBD's expected points added) is `null` on a lot of plays, like kickoffs.
- **There are no player IDs on plays.** Player names only show up inside `playText`, which is a pain if we want player-level data from this. CFBD has other endpoints for player stats that might be more useful for that.

## Quirks / limitations

- `/plays` requires both `year` and `week`, so you can't pull a whole season of plays in one request.
- Filtering is done by team name (`team: 'Rice'`), not by team ID.
- Some fields are nullable in the types even if they're filled in on the samples (e.g. `driveNumber`, `playNumber`, `playText`, `ppa`), so don't assume they're always there.
- Responses for wide queries can get big really fast (the whole week 1 plays was ~23 MB), so we should keep queries narrow.
