import type { NewsStory, NewsTopic } from "@/types/news";

// Bad dates are tolerated everywhere so one broken story can't break /news or the homepage.

export type NewsFilter = NewsTopic | "all";

// Dates are shown in Houston time, matching src/components/home/format.ts.
const TIME_ZONE = "America/Chicago";

// "2026-10-31" with no time. JavaScript reads these as midnight UTC, which is the
// previous evening in Houston, so they're formatted in UTC to keep the same day.
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function toTimestamp(value?: string): number {
  return value ? Date.parse(value) : NaN;
}

/* Stories with bad dates go last, in their original order */
export function sortNewestFirst(stories: NewsStory[]): NewsStory[] {
  return [...stories].sort((a, b) => {
    const aTime = toTimestamp(a.publishedAt);
    const bTime = toTimestamp(b.publishedAt);
    const aBad = Number.isNaN(aTime);
    const bBad = Number.isNaN(bTime);

    if (aBad || bBad) return Number(aBad) - Number(bBad);
    return bTime - aTime;
  });
}

export function filterByTopic(stories: NewsStory[], filter: NewsFilter): NewsStory[] {
  return filter === "all" ? stories : stories.filter((story) => story.topic === filter);
}

export function storiesForTeam(stories: NewsStory[], teamId: string): NewsStory[] {
  return stories.filter((story) => story.team === teamId);
}

export function formatPublishedAt(value?: string): string {
  const time = toTimestamp(value);
  if (Number.isNaN(time)) return "Date unavailable";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(time);
}

/* Returns null for a bad date so the caller can leave the line out */
export function formatEventDate(value?: string): string | null {
  const time = toTimestamp(value);
  if (!value || Number.isNaN(time)) return null;

  return new Intl.DateTimeFormat("en-US", {
    timeZone: DATE_ONLY.test(value) ? "UTC" : TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(time);
}
