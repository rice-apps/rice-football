import type { ScheduleGame } from "@/data/mock/home";

// Games are compared by calendar day in Houston, not by exact time, so a game
// stays "next" for its whole game day, even after kickoff or the final score.

const TIME_ZONE = "America/Chicago";

// "2026-12-15" with no time, as NEWS_TODAY is usually written.
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export type NextOpponentResult =
  | { kind: "found"; game: ScheduleGame }
  | { kind: "season-over" } // valid games, but none today or later
  | { kind: "invalid" }; // no usable games at all

type DatedGame = {
  game: ScheduleGame;
  day: string; // "YYYY-MM-DD", which sorts and compares correctly as a string
  time: number;
};

function calendarDay(time: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(time);
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/* Returns null for a game missing the fields the panel needs, so it gets skipped */
function toDatedGame(value: unknown): DatedGame | null {
  if (typeof value !== "object" || value === null) return null;

  const game = value as ScheduleGame;
  if (typeof game.opponentId !== "string" || game.opponentId === "") return null;
  if (typeof game.opponent !== "string" || game.opponent === "") return null;

  const time = typeof game.kickoff === "string" ? Date.parse(game.kickoff) : NaN;
  if (Number.isNaN(time)) return null;

  // CFBD stores an unannounced kickoff as 05:00Z (midnight Eastern), which is the
  // previous evening in Houston but the correct day in UTC. Known kickoff times use
  // Houston's day, since a 7pm Houston kickoff is already the next day in UTC.
  const day = calendarDay(time, game.kickoffTbd ? "UTC" : TIME_ZONE);
  return { game, day, time };
}

// schedule is unknown on purpose: rows are checked instead of trusted.
export function findNextOpponent(schedule: unknown, today: Date): NextOpponentResult {
  if (!Array.isArray(schedule) || Number.isNaN(today.getTime())) return { kind: "invalid" };

  const games = schedule.map(toDatedGame).filter((game): game is DatedGame => game !== null);
  if (games.length === 0) return { kind: "invalid" };

  const todayDay = calendarDay(today.getTime(), TIME_ZONE);

  // Today's game counts even with a result; later games count until they have one.
  const upcoming = games
    .filter(({ game, day }) => day === todayDay || (day > todayDay && !game.result))
    .sort((a, b) => a.day.localeCompare(b.day) || a.time - b.time);

  return upcoming.length > 0 ? { kind: "found", game: upcoming[0].game } : { kind: "season-over" };
}

/* In development, NEWS_TODAY overrides today for testing, e.g. NEWS_TODAY=2026-12-15 npm run dev */
export function getNewsToday(now: Date = new Date()): Date {
  const override = process.env.NEWS_TODAY;
  if (process.env.NODE_ENV === "production" || !override) return now;

  // Noon Central is the same calendar day in Houston whether or not DST is in effect.
  const parsed = new Date(DATE_ONLY.test(override) ? `${override}T12:00:00-06:00` : override);
  if (Number.isNaN(parsed.getTime())) {
    console.warn(`Ignoring NEWS_TODAY="${override}": not a valid date. Using the real date instead.`);
    return now;
  }
  return parsed;
}
