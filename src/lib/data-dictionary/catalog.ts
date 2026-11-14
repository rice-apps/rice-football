// Documentation of existing structures, not a proposed database schema.
export type DictionaryField = {
  name: string;
  // A display label for the documented TS/JSON shape or current R fixture type.
  type: string;
  description: string;
  // Interpret alongside the structure's nullabilityNotes.
  nullability: 'not-null' | 'nullable' | 'unverified';
  relationship?: string;
  uncertainty?: string;
};

export type DictionaryStructure = {
  id: string;
  name: string;
  source: string;
  purpose: string;
  classification: 'API output' | 'Raw vendor payload' | 'Package fixture';
  // Repository-relative references for developer maintenance; not displayed on the page.
  sourceFiles: string[];
  nullabilityNotes: string;
  limitations: string[];
  fields: DictionaryField[];
};

export const dictionaryCatalog: DictionaryStructure[] = [
  {
    id: 'cfbd-schedule',
    name: 'CFBD schedule (ScheduleGame)',
    source: 'CFBD games API, prepared for the app by getRiceSchedule(season)',
    purpose: 'One regular-season or postseason game on Rice’s schedule, from Rice’s perspective, ordered by date.',
    classification: 'API output',
    sourceFiles: ['src/lib/cfbd/types.ts', 'src/lib/cfbd/schedule.ts'],
    nullabilityNotes: 'Only scores can be missing (null) in the app’s type definition. This does not confirm which values can be missing in all CFBD responses.',
    limitations: [
      'The season is supplied when requesting the schedule. Each row leaves out the season and opponent ID.',
      'homeAway shows Rice’s listed side. It does not tell you whether the game is at a neutral site.',
      'A connection between CFBD IDs, Hudl IDs, and riceFB sample IDs has not been confirmed.',
    ],
    fields: [
      { name: 'gameId', type: 'string', description: 'CFBD game.id converted to a string.', nullability: 'not-null', relationship: 'Identifies the source CFBD game; not a riceFB game_id or Hudl game ID.' },
      { name: 'week', type: 'number', description: 'Week value supplied by CFBD.', nullability: 'not-null' },
      { name: 'opponent', type: 'string', description: 'The other team’s name, selected from homeTeam or awayTeam.', nullability: 'not-null' },
      { name: 'homeAway', type: "'home' | 'away'", description: 'Rice’s home/away side, determined using Rice’s configured CFBD team ID (242).', nullability: 'not-null' },
      { name: 'date', type: 'string', description: 'Game startDate; documented by the app type as an ISO timestamp in UTC. Check startTimeTbd before treating the time as confirmed.', nullability: 'not-null' },
      { name: 'startTimeTbd', type: 'boolean', description: 'CFBD startTimeTBD flag indicating an unconfirmed start time.', nullability: 'not-null' },
      { name: 'conferenceGame', type: 'boolean', description: 'CFBD flag identifying a conference game.', nullability: 'not-null' },
      { name: 'status', type: "'scheduled' | 'completed'", description: 'completed when CFBD completed is true; scheduled otherwise. No other statuses are represented.', nullability: 'not-null' },
      { name: 'riceScore', type: 'number | null', description: 'Rice’s points. Missing scores become null. A score can be present even if the game is not marked completed.', nullability: 'nullable' },
      { name: 'opponentScore', type: 'number | null', description: 'The opponent’s points. Missing scores become null, which is different from a score of zero.', nullability: 'nullable' },
    ],
  },
  {
    id: 'cfbd-standings',
    name: 'CFBD standings (ConferenceStanding)',
    source: 'CFBD records API, prepared for the app by getConferenceStandings(conference, season)',
    purpose: 'One team’s conference and overall win/loss totals for the requested conference and season.',
    classification: 'API output',
    sourceFiles: ['src/lib/cfbd/types.ts', 'src/lib/cfbd/standings.ts'],
    nullabilityNotes: 'The app’s type definition requires a value for every field. Whether values can be missing in other CFBD responses is unverified.',
    limitations: [
      'Rows do not include a team ID, season, conference, ties, or official rank. Team names alone do not confirm a match with another data source.',
      'Rows are sorted by conference win percentage, conference wins, overall win percentage, then team name. This is not an official ranking and does not use conference tiebreakers.',
      'The function expects a CFBD conference abbreviation, such as AAC.',
    ],
    fields: [
      { name: 'team', type: 'string', description: 'Team name from CFBD record.team.', nullability: 'not-null', relationship: 'A team name only. Matching this name to records from other sources has not been verified.' },
      { name: 'conferenceWins', type: 'number', description: 'Number of conference games won, as reported by CFBD.', nullability: 'not-null' },
      { name: 'conferenceLosses', type: 'number', description: 'Number of conference games lost, as reported by CFBD.', nullability: 'not-null' },
      { name: 'overallWins', type: 'number', description: 'Total games won, as reported by CFBD.', nullability: 'not-null' },
      { name: 'overallLosses', type: 'number', description: 'Total games lost, as reported by CFBD.', nullability: 'not-null' },
    ],
  },
  {
    id: 'hudl-tracking',
    name: 'Hudl tracking (HudlTracking)',
    source: 'Hudl IQ per-play tracking download referenced by Play.trackingURL',
    purpose: 'Tracks each player’s position over time during a play. This is different from the single-moment snapshots returned by playEvents.',
    classification: 'Raw vendor payload',
    sourceFiles: ['src/lib/hudl/types.ts', 'docs/hudl.md', 'scripts/hudl/fetch-sample.ts', 'samples/hudl/README.md'],
    nullabilityNotes: 'These fields were present in the documented sample and are required by the local type definition. Whether they can be missing in other Hudl files is unverified.',
    limitations: [
      'This guide covers fields seen in the documented sample, not every possible Hudl field. [] means an item in a list.',
      'The tracking file does not include its game or play ID. The sample download tool saves those IDs separately in selection.json.',
      'Raw tracking files are kept out of the public repository. Download links expire and must not be shared publicly or used as permanent IDs.',
      'Some download links return an access-denied error (403). Having a link does not guarantee the file can be downloaded.',
    ],
    fields: [
      { name: 'tracks', type: 'object[]', description: 'Collection of player tracks in the downloaded play file; counts vary by file.', nullability: 'unverified' },
      { name: 'tracks[].player', type: 'object', description: 'Player reference attached to a track.', nullability: 'unverified' },
      { name: 'tracks[].player.player_id', type: 'number', description: 'Numeric player identifier in the tracking payload.', nullability: 'unverified', relationship: 'The project notes report that one sampled player ID also appears in the game’s event lineup.', uncertainty: 'Unverified: whether this ID always matches roster records. Matching it to IDs from other providers is also unverified.' },
      { name: 'tracks[].steps', type: 'object[]', description: 'Tracking steps recorded for the player.', nullability: 'unverified' },
      { name: 'tracks[].steps[].timestamp', type: 'number', description: 'Timestamp value for a tracking step.', nullability: 'unverified', uncertainty: 'Unverified: the time unit, when counting starts, and how often positions are recorded. Do not assume the value is in seconds or is a calendar timestamp.' },
      { name: 'tracks[].steps[].pitch', type: 'object', description: 'Coordinate object for the tracking step.', nullability: 'unverified' },
      { name: 'tracks[].steps[].pitch.x', type: 'number', description: 'Vendor x coordinate for the player at this step.', nullability: 'unverified', uncertainty: 'Unverified: the measurement unit, where zero is, and which direction the values increase on the field.' },
      { name: 'tracks[].steps[].pitch.y', type: 'number', description: 'Vendor y coordinate for the player at this step.', nullability: 'unverified', uncertainty: 'Unverified: the measurement unit, where zero is, and which direction the values increase on the field.' },
    ],
  },
  {
    id: 'ricefb-teams',
    name: 'riceFB teams fixture',
    source: 'Bundled teams.csv, returned by get_teams()',
    purpose: 'Small local set of sample teams used by the R package.',
    classification: 'Package fixture',
    sourceFiles: ['packages/riceFB/inst/extdata/teams.csv', 'packages/riceFB/R/teams.R', 'packages/riceFB/R/fixtures.R', 'packages/riceFB/README.md'],
    nullabilityNotes: 'User-run R checks found no missing values in all 7 returned team rows (6 fields). Whether future values can be missing remains unverified.',
    limitations: ['These are sample records, not live results. User-run str() checks confirmed all 6 fields are R character values in the installed package.', 'Matching these sample IDs to provider IDs has not been verified.'],
    fields: [
      { name: 'team_id', type: 'R character', description: 'Fixture team identifier, such as rice.', nullability: 'unverified', relationship: 'Referenced by games.home_team_id, games.away_team_id, plays.offense_team_id, and plays.defense_team_id within these fixtures.' },
      { name: 'school', type: 'R character', description: 'School name in the fixture.', nullability: 'unverified' },
      { name: 'mascot', type: 'R character', description: 'Team mascot name in the fixture.', nullability: 'unverified' },
      { name: 'abbreviation', type: 'R character', description: 'Short team label in the fixture; not an established external ID.', nullability: 'unverified' },
      { name: 'conference', type: 'R character', description: 'Conference label in the fixture; not a historical membership record.', nullability: 'unverified' },
      { name: 'classification', type: 'R character', description: 'Football classification label; current fixture values are fbs and fcs.', nullability: 'unverified', uncertainty: 'Unverified: which other values are allowed.' },
    ],
  },
  {
    id: 'ricefb-games',
    name: 'riceFB games fixture',
    source: 'Bundled games.csv, filtered by get_games(season) or get_schedule(team, season)',
    purpose: 'Sample game records used to demonstrate season and team schedule access.',
    classification: 'Package fixture',
    sourceFiles: ['packages/riceFB/inst/extdata/games.csv', 'packages/riceFB/R/games.R', 'packages/riceFB/R/schedule.R', 'packages/riceFB/R/fixtures.R', 'packages/riceFB/README.md'],
    nullabilityNotes: 'User-run R checks found no missing values in the 5 game rows returned for 2026 (10 fields). Other seasons were not checked in that R session. Whether future values can be missing remains unverified.',
    limitations: ['User-run str() checks confirmed the listed types for get_games(2026) in the installed package, including start_date as text rather than an R Date. R chooses types when reading the CSV; different data may produce different types.', 'Scores, dates, and identities are sample content, not live results.'],
    fields: [
      { name: 'game_id', type: 'R character', description: 'Fixture game identifier, such as game-1.', nullability: 'unverified', relationship: 'Referenced by plays.game_id and accepted by get_plays(game_id); not CFBD gameId or a Hudl game ID.' },
      { name: 'season', type: 'R integer', description: 'Season year used by get_games(season) to filter rows.', nullability: 'unverified' },
      { name: 'week', type: 'R integer', description: 'Week number recorded in the fixture.', nullability: 'unverified' },
      { name: 'season_type', type: 'R character', description: 'Season segment label; current fixture rows use regular.', nullability: 'unverified', uncertainty: 'Unverified: allowed values beyond the bundled examples.' },
      { name: 'start_date', type: 'R character', description: 'Game date text in YYYY-MM-DD format; the fixture does not provide a kickoff time or timezone.', nullability: 'unverified' },
      { name: 'venue', type: 'R character', description: 'Venue name in the fixture.', nullability: 'unverified' },
      { name: 'home_team_id', type: 'R character', description: 'Home-side fixture team identifier.', nullability: 'unverified', relationship: 'Matches teams.team_id within the package fixtures.' },
      { name: 'away_team_id', type: 'R character', description: 'Away-side fixture team identifier.', nullability: 'unverified', relationship: 'Matches teams.team_id within the package fixtures.' },
      { name: 'home_points', type: 'R integer', description: 'Home team’s points recorded in the fixture.', nullability: 'unverified' },
      { name: 'away_points', type: 'R integer', description: 'Away team’s points recorded in the fixture.', nullability: 'unverified' },
    ],
  },
  {
    id: 'ricefb-plays',
    name: 'riceFB plays fixture',
    source: 'Bundled plays.csv, filtered by get_plays(game_id)',
    purpose: 'Sample play records demonstrating game-level play access in the R package.',
    classification: 'Package fixture',
    sourceFiles: ['packages/riceFB/inst/extdata/plays.csv', 'packages/riceFB/R/plays.R', 'packages/riceFB/R/fixtures.R', 'packages/riceFB/README.md'],
    nullabilityNotes: 'User-run R checks found no missing values in the 12 plays returned for game-1 (14 fields). Other games were not checked in that R session. Whether future values can be missing remains unverified.',
    limitations: ['These are sample plays, not a complete record of real games. User-run str() checks confirmed the listed types for get_plays("game-1") in the installed package: text, integers, and a logical scoring flag. Types for other games were not checked in that R session.', 'Names in play_text are fictional and should not be used as player IDs. Yardage rules for special plays and the full list of play types are unverified.'],
    fields: [
      { name: 'play_id', type: 'R character', description: 'Fixture play identifier, such as play-1; not a vendor play ID.', nullability: 'unverified' },
      { name: 'game_id', type: 'R character', description: 'Fixture game containing the play; used by get_plays() to filter rows.', nullability: 'unverified', relationship: 'Matches games.game_id within the package fixtures.' },
      { name: 'offense_team_id', type: 'R character', description: 'Offensive team’s fixture identifier.', nullability: 'unverified', relationship: 'Matches teams.team_id within the package fixtures.' },
      { name: 'defense_team_id', type: 'R character', description: 'Defensive team’s fixture identifier.', nullability: 'unverified', relationship: 'Matches teams.team_id within the package fixtures.' },
      { name: 'drive_number', type: 'R integer', description: 'Drive number recorded in the fixture.', nullability: 'unverified', uncertainty: 'Unverified: when numbering starts over and whether numbers repeat outside the sample.' },
      { name: 'play_number', type: 'R integer', description: 'Play number recorded in the fixture; examples restart for a new drive.', nullability: 'unverified', uncertainty: 'Unverified: when numbering starts over in other data. Do not use this number alone to identify a play.' },
      { name: 'period', type: 'R integer', description: 'Game period number recorded in the fixture.', nullability: 'unverified', uncertainty: 'Unverified: how overtime periods are numbered. The sample uses periods 1–4.' },
      { name: 'down', type: 'R integer', description: 'Down recorded for the play; examples use 1–4.', nullability: 'unverified', uncertainty: 'Unverified: which value is used for plays without a regular down.' },
      { name: 'distance', type: 'R integer', description: 'Numeric distance field included in the plays fixture.', nullability: 'unverified', uncertainty: 'Unverified: what this distance measures, its unit, and how goal-to-go situations are recorded. The package docs do not explain these details.' },
      { name: 'yards_to_goal', type: 'R integer', description: 'Numeric field named yards_to_goal in the plays fixture.', nullability: 'unverified', uncertainty: 'Unverified: what this value measures, its unit, which goal line it refers to, and when it is measured. The package docs do not explain these details.' },
      { name: 'yards_gained', type: 'R integer', description: 'Recorded yardage gain for the fixture play, including zero and negative gains. Sample rush/pass/sack values agree with play_text.', nullability: 'unverified', uncertainty: 'Unverified: how penalties, returns, and special plays affect this value. For example, punt distance in play_text differs from yards_gained.' },
      { name: 'play_type', type: 'R character', description: 'Play category label, such as Rush, Pass Reception, or Sack.', nullability: 'unverified', uncertainty: 'Unverified: the full list of allowed values.' },
      { name: 'play_text', type: 'R character', description: 'A fictional play description written in plain text. Player names here are not player IDs.', nullability: 'unverified' },
      { name: 'scoring', type: 'R logical', description: 'TRUE/FALSE scoring flag; touchdowns and a made field goal are TRUE in the fixture.', nullability: 'unverified', uncertainty: 'Unverified: how scoring situations outside the sample are recorded.' },
    ],
  },
];
