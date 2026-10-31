import { getRecords, type TeamRecords } from 'cfbd';
import { cfbdRequest, runIfMain, saveSample, validateSeason } from '@/lib/cfbd/client';
import type { ConferenceStanding } from '@/lib/cfbd/types';

/*
 * Returns a conference's standings for a season, sorted
 * The conference parameter must be CFBD's abbreviation because even though the API promises it,
 * the full name ('American Athletic') returns no results.
 */
export async function getConferenceStandings(conference: string, season: number): Promise<ConferenceStanding[]> {
  validateSeason(season);

  const records = await cfbdRequest(() => getRecords({ query: { year: season, conference } }));

  // CFBD returns an empty array instead of an error when nothing matches, so we need to throw explicitly
  if (records.length === 0) {
    throw new Error(`CFBD returned no standings for conference '${conference}' in ${season}.`);
  }

  return records.map(toConferenceStanding).sort(compareStandings);
}

/* Converts a raw CFBD team record into a ConferenceStanding*/
function toConferenceStanding(record: TeamRecords): ConferenceStanding {
  // Normalize raw CFBD data to the application facing type
  return {
    team: record.team,
    conferenceWins: record.conferenceGames.wins,
    conferenceLosses: record.conferenceGames.losses,
    overallWins: record.total.wins,
    overallLosses: record.total.losses,
  };
}

/*
 * CFBD returns teams in no particular order and has no rank field,
 * so sort by conference win %, then conference wins, then overall win %, then name.
 * Does not apply official tiebreaking 
 */
function compareStandings(a: ConferenceStanding, b: ConferenceStanding): number {
  return (
    winPercentage(b.conferenceWins, b.conferenceLosses) - winPercentage(a.conferenceWins, a.conferenceLosses) ||
    b.conferenceWins - a.conferenceWins ||
    winPercentage(b.overallWins, b.overallLosses) - winPercentage(a.overallWins, a.overallLosses) ||
    a.team.localeCompare(b.team)
  );
}

function winPercentage(wins: number, losses: number): number {
  const games = wins + losses;
  return games === 0 ? 0 : wins / games;
}

runIfMain(import.meta.url, async () => {
  const standings = await getConferenceStandings('AAC', 2026);
  await saveSample('conference-standings', standings);
});
