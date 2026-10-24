import type { Report } from "@/types/report";

// Fictional analyst reports — names and contents are invented for the prototype.
// Covers every category with a mix of static and runnable reports.
export const reports: Report[] = [
  {
    id: "report-1",
    name: "Red Zone Efficiency Review",
    description:
      "Breakdown of Rice red zone play calling and success rates through week 8.",
    category: "offense",
    kind: "static",
    fileType: ".pdf",
    createdAt: "2026-10-20T14:30:00Z",
  },
  {
    id: "report-2",
    name: "Explosive Play Tracker",
    description:
      "Weekly script tracking offensive plays of 20+ yards by formation and personnel grouping.",
    category: "offense",
    kind: "runnable",
    fileType: ".R",
    createdAt: "2026-10-18T09:15:00Z",
  },
  {
    id: "report-3",
    name: "Third Down Tendencies",
    description:
      "Interactive visualization of third down play selection by distance bucket.",
    category: "offense",
    kind: "static",
    fileType: ".html",
    createdAt: "2026-10-12T16:45:00Z",
  },
  {
    id: "report-4",
    name: "Opponent Pressure Rates",
    description:
      "Static summary of blitz and pressure rates for upcoming opponents.",
    category: "defense",
    kind: "static",
    fileType: ".pdf",
    createdAt: "2026-10-19T11:00:00Z",
  },
  {
    id: "report-5",
    name: "Coverage Shell Breakdown",
    description:
      "Python script charting defensive coverage shells faced by down and distance.",
    category: "defense",
    kind: "runnable",
    fileType: ".py",
    createdAt: "2026-10-15T13:20:00Z",
  },
  {
    id: "report-6",
    name: "Tackling Efficiency Data",
    description:
      "Raw missed-tackle and solo-tackle counts by defender, exported for film review.",
    category: "defense",
    kind: "static",
    fileType: ".csv",
    createdAt: "2026-10-08T10:05:00Z",
  },
  {
    id: "report-7",
    name: "Field Position After Punts",
    description:
      "Net punting and opponent starting field position trends across the season.",
    category: "special-teams",
    kind: "static",
    fileType: ".pdf",
    createdAt: "2026-10-17T15:40:00Z",
  },
  {
    id: "report-8",
    name: "Kickoff Return Model",
    description:
      "R script estimating expected return yards by kick location and hang time.",
    category: "special-teams",
    kind: "runnable",
    fileType: ".R",
    createdAt: "2026-10-10T08:50:00Z",
  },
  {
    id: "report-9",
    name: "Transfer Portal Watchlist",
    description:
      "Current watchlist of portal targets with production and measurables summary.",
    category: "player-personnel",
    kind: "static",
    fileType: ".csv",
    createdAt: "2026-10-21T17:10:00Z",
  },
  {
    id: "report-10",
    name: "Snap Count Distribution",
    description:
      "Python script summarizing offensive and defensive snap shares by player per game.",
    category: "player-personnel",
    kind: "runnable",
    fileType: ".py",
    createdAt: "2026-10-14T12:25:00Z",
  },
  {
    id: "report-11",
    name: "Depth Chart Scenarios",
    description:
      "Interactive depth chart projections under different injury scenarios.",
    category: "player-personnel",
    kind: "static",
    fileType: ".html",
    createdAt: "2026-10-06T14:00:00Z",
  },
];
