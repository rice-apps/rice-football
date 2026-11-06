// These describe the selected vendor fields, not our future database schema.
export type HudlPage<T> = { totalCount: number; items: T[] };
export type HudlTeam = { id: number; name: string };
export type HudlGame = {
  id: number;
  name: string;
  date: string;
  homeTeam: HudlTeam;
  awayTeam: HudlTeam;
};
export type HudlPlayer = {
  id: number;
  name: string;
  team: HudlTeam | null;
  mostCommonNumber: number | null;
  mostCommonPosition: { generalPosition: string } | null;
};
export type HudlPlay = {
  id: string;
  name: string;
  gameIndex: number;
  game: { id: number };
  trackingURL: string | null;
};

// Observed in a live per-play tracking response. Preserve the original JSON.
export type HudlTracking = {
  tracks: {
    player: { player_id: number };
    steps: { timestamp: number; pitch: { x: number; y: number } }[];
  }[];
};
