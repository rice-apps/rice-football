/*
 * Checks for the news prototype's logic. There's no test framework in the repo, so run:
 *
 *   npx tsx src/lib/news/check.ts
 *
 * Bad-date cases live here instead of in the fixtures so /news never shows broken entries.
 */

import { riceSchedule } from "@/data/mock/home";
import { NEWS_TEAM_NAMES, newsStories } from "@/data/mock/news";
import { toHomeSchedule } from "@/lib/cfbd/home";
import type { ScheduleGame } from "@/lib/cfbd/types";
import { findNextOpponent, getNewsToday } from "@/lib/news/nextOpponent";
import {
  filterByTopic,
  formatEventDate,
  formatPublishedAt,
  sortNewestFirst,
  storiesForTeam,
} from "@/lib/news/stories";
import { NEWS_TOPICS } from "@/types/news";

let failures = 0;

function check(name: string, actual: unknown, expected: unknown) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  if (!pass) failures += 1;
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}`);
  if (!pass) console.log(`      expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

/* The next opponent's id, or "season-over"/"invalid" */
function nextOpponent(schedule: unknown, today: Date): string {
  const result = findNextOpponent(schedule, today);
  return result.kind === "found" ? result.game.opponentId : result.kind;
}

/* A Houston time on a given day */
function at(day: string, time = "12:00"): Date {
  return new Date(`${day}T${time}:00-06:00`);
}

console.log("\nFixtures");
check("links are on example.com", newsStories.every((s) => s.sourceUrl.startsWith("https://example.com/sample-news/")), true);
check("ids are unique", new Set(newsStories.map((s) => s.id)).size, newsStories.length);
check("publishedAt parses", newsStories.every((s) => !Number.isNaN(Date.parse(s.publishedAt))), true);
check("eventDate parses", newsStories.every((s) => !s.eventDate || !Number.isNaN(Date.parse(s.eventDate))), true);
check("teams have display names", newsStories.every((s) => s.team in NEWS_TEAM_NAMES), true);
check("every topic has a story", NEWS_TOPICS.every((t) => newsStories.some((s) => s.topic === t.value)), true);

console.log("\nSorting and filtering");
const sorted = sortNewestFirst(newsStories);
check("newest first", sorted.every((s, i) => i === 0 || Date.parse(sorted[i - 1].publishedAt) >= Date.parse(s.publishedAt)), true);
check("fixture order untouched", newsStories[0].id, "sample-001");
check("'all' keeps every story", filterByTopic(newsStories, "all").length, newsStories.length);
check("topic counts add up", NEWS_TOPICS.reduce((n, t) => n + filterByTopic(newsStories, t.value).length, 0), newsStories.length);
check("UTSA has 3 stories", storiesForTeam(newsStories, "utsa").length, 3);
check("ECU has none", storiesForTeam(newsStories, "ecu").length, 0);

console.log("\nBad dates");
const [newer, older] = newsStories; // Nov 5, Nov 3
const bad = ["not a date", "", "2026-13-45", undefined].map((publishedAt, i) => ({
  ...newer,
  id: `bad-${i}`,
  publishedAt: publishedAt as string,
}));
check(
  "sorted last, in original order",
  sortNewestFirst([bad[0], older, bad[1], bad[2], newer, bad[3]]).map((s) => s.id),
  [newer.id, older.id, "bad-0", "bad-1", "bad-2", "bad-3"],
);
check("formatPublishedAt: valid", formatPublishedAt("2026-11-05T16:30:00-06:00"), "Thu, Nov 5, 2026, 4:30 PM CST");
for (const value of ["not a date", "", "2026-13-45", undefined]) {
  check(`formatPublishedAt(${JSON.stringify(value)})`, formatPublishedAt(value), "Date unavailable");
  check(`formatEventDate(${JSON.stringify(value)})`, formatEventDate(value), null);
}
check("date-only eventDate keeps its day", formatEventDate("2026-10-31"), "Oct 31, 2026");

console.log("\nNext opponent: mock schedule");
const withFinal = riceSchedule.map((g) => (g.opponentId === "utsa" ? { ...g, result: { riceScore: 20, opponentScore: 17 } } : g));
check("game day morning", nextOpponent(riceSchedule, at("2026-11-07", "08:00")), "utsa");
check("game day 11:30pm", nextOpponent(riceSchedule, at("2026-11-07", "23:30")), "utsa");
check("game day after final score", nextOpponent(withFinal, at("2026-11-07", "20:00")), "utsa");
check("day after", nextOpponent(riceSchedule, at("2026-11-08")), "tulane");
check("past game without a result is skipped", nextOpponent(riceSchedule, at("2026-11-01")), "utsa");
check("opponent with no stories", nextOpponent(riceSchedule, at("2026-11-20")), "ecu");
check("season over", nextOpponent(riceSchedule, at("2026-12-15")), "season-over");

console.log("\nNext opponent: CFBD TBD kickoffs");
const cfbdGame = (opponent: string, date: string, startTimeTbd: boolean): ScheduleGame => ({
  gameId: opponent,
  week: 0,
  opponent,
  homeAway: "home",
  date,
  startTimeTbd,
  conferenceGame: true,
  status: "scheduled",
  riceScore: null,
  opponentScore: null,
});
const cfbd = toHomeSchedule([
  cfbdGame("North Texas", "2026-11-07T05:00:00.000Z", true),
  cfbdGame("Tulane", "2026-11-14T05:00:00.000Z", true),
  cfbdGame("Temple", "2026-11-21T01:30:00.000Z", false), // 7:30pm Nov 20 in Houston
]);
check("TBD game counts on its own day", nextOpponent(cfbd, at("2026-11-07", "21:00")), "north-texas");
check("evening kickoff counts on its Houston day", nextOpponent(cfbd, at("2026-11-20", "22:00")), "temple");
check("day after evening kickoff", nextOpponent(cfbd, at("2026-11-21")), "season-over");

console.log("\nNext opponent: broken schedules");
check("null", nextOpponent(null, at("2026-11-07")), "invalid");
check("not an array", nextOpponent({ games: [] }, at("2026-11-07")), "invalid");
check("empty", nextOpponent([], at("2026-11-07")), "invalid");
check("every row broken", nextOpponent([42, null, { opponentId: "x", opponent: "X", kickoff: "nope" }], at("2026-11-07")), "invalid");
check("one broken row is skipped", nextOpponent([{ kickoff: "bad" }, ...riceSchedule], at("2026-11-08")), "tulane");
check("invalid today", nextOpponent(riceSchedule, new Date("garbage")), "invalid");

console.log("\nNEWS_TODAY");
const env = process.env as Record<string, string | undefined>;
const realNow = at("2026-11-07");
env.NODE_ENV = "development";
delete env.NEWS_TODAY; // assigning undefined would store the string "undefined"
check("unset", getNewsToday(realNow).toISOString(), realNow.toISOString());
env.NEWS_TODAY = "2026-12-15";
check("date only", getNewsToday(realNow).toISOString(), "2026-12-15T18:00:00.000Z");
env.NEWS_TODAY = "2026-11-14T10:00:00-06:00";
check("full timestamp", getNewsToday(realNow).toISOString(), "2026-11-14T16:00:00.000Z");
env.NEWS_TODAY = "not-a-date";
check("invalid falls back (warning expected)", getNewsToday(realNow).toISOString(), realNow.toISOString());
env.NODE_ENV = "production";
env.NEWS_TODAY = "2026-12-15";
check("ignored in production", getNewsToday(realNow).toISOString(), realNow.toISOString());

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exitCode = failures === 0 ? 0 : 1;
