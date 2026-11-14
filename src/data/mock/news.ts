/*
 * Sample news for the /news page and the homepage next-opponent panel.
 *
 * Entirely fictional: every player, coach, recruit, and source is invented, and
 * every link points at example.com. Teams are real only so stories can match the
 * schedule. Only teams whose id is the same in the CFBD and mock schedules are
 * used (e.g. not "ecu"/"east-carolina"), so matching works with either source.
 */

import type { NewsStory } from "@/types/news";

// Display names for the teams that appear in these stories.
export const NEWS_TEAM_NAMES: Record<string, string> = {
  rice: "Rice",
  utsa: "UTSA",
  "north-texas": "North Texas",
  tulane: "Tulane",
  tulsa: "Tulsa",
  temple: "Temple",
  memphis: "Memphis",
};

// Unsorted on purpose; the page sorts newest first.
export const newsStories: NewsStory[] = [
  {
    id: "sample-001",
    headline: "UTSA starting quarterback Rowan Thistlewood listed as questionable with ankle injury",
    sourceName: "Sample Sports Wire",
    sourceUrl: "https://example.com/sample-news/utsa-qb-ankle",
    publishedAt: "2026-11-05T16:30:00-06:00",
    team: "utsa",
    topic: "general",
    eventDate: "2026-10-31",
  },
  {
    id: "sample-002",
    headline: "UTSA promotes linebackers coach Delphine Marchetti to interim defensive coordinator",
    sourceName: "Example Gridiron Report",
    sourceUrl: "https://example.com/sample-news/utsa-interim-dc",
    publishedAt: "2026-11-03T10:15:00-06:00",
    team: "utsa",
    topic: "general",
  },
  {
    id: "sample-003",
    headline: "UTSA reserve safety Kellan Brightwater enters the transfer portal",
    sourceName: "Demo Portal Tracker",
    sourceUrl: "https://example.com/sample-news/utsa-safety-portal",
    publishedAt: "2026-11-06T09:00:00-06:00",
    team: "utsa",
    topic: "transfer-portal",
    eventDate: "2026-11-05",
  },
  {
    id: "sample-004",
    headline: "Rice receiver Tobias Quillfeather expected back from hamstring injury this week",
    sourceName: "Sample Sports Wire",
    sourceUrl: "https://example.com/sample-news/rice-wr-hamstring",
    publishedAt: "2026-11-04T14:00:00-06:00",
    team: "rice",
    topic: "general",
    eventDate: "2026-10-17",
  },
  {
    id: "sample-005",
    headline: "Class of 2027 linebacker Caspian Ollerenshaw commits to Rice",
    sourceName: "Placeholder Recruiting Desk",
    sourceUrl: "https://example.com/sample-news/rice-lb-commit",
    publishedAt: "2026-11-02T19:45:00-06:00",
    team: "rice",
    topic: "recruiting",
    eventDate: "2026-11-02",
  },
  {
    id: "sample-006",
    headline: "Rice offensive lineman Dorian Featherstonhaugh enters the transfer portal",
    sourceName: "Demo Portal Tracker",
    sourceUrl: "https://example.com/sample-news/rice-ol-portal",
    publishedAt: "2026-10-28T11:20:00-05:00",
    team: "rice",
    topic: "transfer-portal",
    eventDate: "2026-10-27",
  },
  {
    id: "sample-007",
    headline: "Rice adds former analyst Juniper Halvorsen as quality control coach",
    sourceName: "Example Gridiron Report",
    sourceUrl: "https://example.com/sample-news/rice-qc-hire",
    publishedAt: "2026-10-22T08:30:00-05:00",
    team: "rice",
    topic: "general",
  },
  {
    id: "sample-008",
    headline: "North Texas running back Ezekiel Vandermolen out for the season with knee injury",
    sourceName: "Sample Sports Wire",
    sourceUrl: "https://example.com/sample-news/unt-rb-knee",
    publishedAt: "2026-11-01T12:00:00-05:00",
    team: "north-texas",
    topic: "general",
    eventDate: "2026-10-31",
  },
  {
    id: "sample-009",
    headline: "Class of 2027 cornerback Leopold Ainsworth-Kaye commits to North Texas",
    sourceName: "Placeholder Recruiting Desk",
    sourceUrl: "https://example.com/sample-news/unt-cb-commit",
    publishedAt: "2026-10-26T17:10:00-05:00",
    team: "north-texas",
    topic: "recruiting",
    eventDate: "2026-10-25",
  },
  {
    id: "sample-010",
    headline: "Tulane names Augustin Pemberton-Lowe offensive coordinator after midseason change",
    sourceName: "Example Gridiron Report",
    sourceUrl: "https://example.com/sample-news/tulane-oc-change",
    publishedAt: "2026-11-06T15:40:00-06:00",
    team: "tulane",
    topic: "general",
  },
  {
    id: "sample-011",
    headline: "Tulane backup quarterback Fenwick Rosegarden enters the transfer portal",
    sourceName: "Demo Portal Tracker",
    sourceUrl: "https://example.com/sample-news/tulane-qb-portal",
    publishedAt: "2026-10-30T13:25:00-05:00",
    team: "tulane",
    topic: "transfer-portal",
    eventDate: "2026-10-29",
  },
  {
    id: "sample-012",
    headline: "Tulsa defensive end Bartholomew Achterberg sidelined with shoulder injury",
    sourceName: "Sample Sports Wire",
    sourceUrl: "https://example.com/sample-news/tulsa-de-shoulder",
    publishedAt: "2026-10-20T10:00:00-05:00",
    team: "tulsa",
    topic: "general",
    eventDate: "2026-10-17",
  },
  {
    id: "sample-013",
    headline: "Temple parts ways with special teams coordinator Harriet Quenneville",
    sourceName: "Example Gridiron Report",
    sourceUrl: "https://example.com/sample-news/temple-st-coordinator",
    publishedAt: "2026-10-24T09:50:00-05:00",
    team: "temple",
    topic: "general",
  },
  {
    id: "sample-014",
    headline: "Class of 2027 wide receiver Thaddeus Winterbourne commits to Memphis",
    sourceName: "Placeholder Recruiting Desk",
    sourceUrl: "https://example.com/sample-news/memphis-wr-commit",
    publishedAt: "2026-10-18T20:05:00-05:00",
    team: "memphis",
    topic: "recruiting",
    eventDate: "2026-10-18",
  },
];
