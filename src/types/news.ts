// Prototype type for fictional news fixtures. Not a production schema; real
// sources and collection are owned by the lead and not decided yet.
export type NewsTopic = "general" | "recruiting" | "transfer-portal";

export type NewsStory = {
  id: string;
  headline: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string; // ISO date string: when the story was published
  team: string; // homepage team id, e.g. "north-texas" (see toTeamId in src/lib/cfbd/home.ts)
  topic: NewsTopic;
  eventDate?: string; // ISO date string: when the commitment/portal entry/etc. happened, if known
};

// Display labels for the /news filter buttons and story badges.
export const NEWS_TOPICS: { value: NewsTopic; label: string }[] = [
  { value: "general", label: "General & conference" },
  { value: "recruiting", label: "Recruiting" },
  { value: "transfer-portal", label: "Transfer portal" },
];

// Labels eventDate so it can't be mistaken for the publish date.
export const EVENT_DATE_LABELS: Record<NewsTopic, string> = {
  general: "Occurred",
  recruiting: "Committed",
  "transfer-portal": "Entered portal",
};
