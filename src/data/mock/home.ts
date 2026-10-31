/*
 * Mock data for the staff homepage.
 *
 * Development data only: records, scores, and dates are made up. This will be
 * replaced by real CollegeFootballData once that integration exists, so the
 * shapes here are not a production schema.
 */

export const RICE_TEAM_ID = "rice";

export const MOCK_SEASON = 2026;
export const MOCK_CONFERENCE = "American Athletic Conference";

export type WinLoss = {
  wins: number;
  losses: number;
};

export type StandingsRow = {
  teamId: string;
  team: string;
  conference: WinLoss;
  overall: WinLoss;
};

export type ScheduleGame = {
  id: string;
  week: number;
  /** ISO 8601 kickoff time with offset. */
  kickoff: string;
  /** True when the kickoff time hasn't been announced yet. */
  kickoffTbd?: boolean;
  opponentId: string;
  opponent: string;
  isHome: boolean;
  isConference: boolean;
  /** Present only once the game has been played. */
  result?: {
    riceScore: number;
    opponentScore: number;
  };
};

// Pre-sorted by conference record.
export const conferenceStandings: StandingsRow[] = [
  { teamId: "memphis", team: "Memphis", conference: { wins: 4, losses: 0 }, overall: { wins: 7, losses: 0 } },
  { teamId: "tulane", team: "Tulane", conference: { wins: 3, losses: 0 }, overall: { wins: 6, losses: 1 } },
  { teamId: "army", team: "Army", conference: { wins: 3, losses: 1 }, overall: { wins: 5, losses: 2 } },
  { teamId: "north-texas", team: "North Texas", conference: { wins: 3, losses: 1 }, overall: { wins: 6, losses: 1 } },
  { teamId: "rice", team: "Rice", conference: { wins: 2, losses: 1 }, overall: { wins: 5, losses: 2 } },
  { teamId: "utsa", team: "UTSA", conference: { wins: 2, losses: 2 }, overall: { wins: 4, losses: 3 } },
  { teamId: "navy", team: "Navy", conference: { wins: 2, losses: 2 }, overall: { wins: 4, losses: 3 } },
  { teamId: "usf", team: "South Florida", conference: { wins: 1, losses: 2 }, overall: { wins: 4, losses: 3 } },
  { teamId: "ecu", team: "East Carolina", conference: { wins: 1, losses: 2 }, overall: { wins: 3, losses: 4 } },
  { teamId: "tulsa", team: "Tulsa", conference: { wins: 1, losses: 3 }, overall: { wins: 3, losses: 4 } },
  { teamId: "uab", team: "UAB", conference: { wins: 1, losses: 3 }, overall: { wins: 2, losses: 5 } },
  { teamId: "temple", team: "Temple", conference: { wins: 0, losses: 3 }, overall: { wins: 2, losses: 5 } },
  { teamId: "charlotte", team: "Charlotte", conference: { wins: 0, losses: 3 }, overall: { wins: 1, losses: 6 } },
  { teamId: "fau", team: "Florida Atlantic", conference: { wins: 0, losses: 4 }, overall: { wins: 1, losses: 6 } },
];

// Week 8 is a bye.
export const riceSchedule: ScheduleGame[] = [
  {
    id: "2026-w1",
    week: 1,
    kickoff: "2026-09-05T18:00:00-05:00",
    opponentId: "sam-houston",
    opponent: "Sam Houston",
    isHome: true,
    isConference: false,
    result: { riceScore: 31, opponentScore: 17 },
  },
  {
    id: "2026-w2",
    week: 2,
    kickoff: "2026-09-12T19:00:00-05:00",
    opponentId: "houston",
    opponent: "Houston",
    isHome: false,
    isConference: false,
    result: { riceScore: 14, opponentScore: 28 },
  },
  {
    id: "2026-w3",
    week: 3,
    kickoff: "2026-09-19T18:00:00-05:00",
    opponentId: "texas-southern",
    opponent: "Texas Southern",
    isHome: true,
    isConference: false,
    result: { riceScore: 42, opponentScore: 10 },
  },
  {
    id: "2026-w4",
    week: 4,
    kickoff: "2026-09-26T14:30:00-05:00",
    opponentId: "louisiana-tech",
    opponent: "Louisiana Tech",
    isHome: false,
    isConference: false,
    result: { riceScore: 24, opponentScore: 21 },
  },
  {
    id: "2026-w5",
    week: 5,
    kickoff: "2026-10-03T18:00:00-05:00",
    opponentId: "tulsa",
    opponent: "Tulsa",
    isHome: true,
    isConference: true,
    result: { riceScore: 27, opponentScore: 20 },
  },
  {
    id: "2026-w6",
    week: 6,
    kickoff: "2026-10-10T11:00:00-05:00",
    opponentId: "memphis",
    opponent: "Memphis",
    isHome: false,
    isConference: true,
    result: { riceScore: 17, opponentScore: 35 },
  },
  {
    id: "2026-w7",
    week: 7,
    kickoff: "2026-10-17T18:00:00-05:00",
    opponentId: "charlotte",
    opponent: "Charlotte",
    isHome: true,
    isConference: true,
    result: { riceScore: 30, opponentScore: 13 },
  },
  {
    id: "2026-w9",
    week: 9,
    kickoff: "2026-10-31T18:30:00-05:00",
    opponentId: "north-texas",
    opponent: "North Texas",
    isHome: false,
    isConference: true,
  },
  {
    id: "2026-w10",
    week: 10,
    kickoff: "2026-11-07T15:00:00-06:00",
    opponentId: "utsa",
    opponent: "UTSA",
    isHome: true,
    isConference: true,
  },
  {
    id: "2026-w11",
    week: 11,
    kickoff: "2026-11-14T14:30:00-06:00",
    opponentId: "tulane",
    opponent: "Tulane",
    isHome: false,
    isConference: true,
  },
  {
    id: "2026-w12",
    week: 12,
    kickoff: "2026-11-21T13:00:00-06:00",
    opponentId: "ecu",
    opponent: "East Carolina",
    isHome: true,
    isConference: true,
  },
  {
    id: "2026-w13",
    week: 13,
    kickoff: "2026-11-28T11:00:00-06:00",
    opponentId: "usf",
    opponent: "South Florida",
    isHome: false,
    isConference: true,
  },
];
