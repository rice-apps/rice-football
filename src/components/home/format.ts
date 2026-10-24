import type { WinLoss } from "@/data/mock/home";

// Kickoff times are shown in Houston time regardless of where the page renders.
const TIME_ZONE = "America/Chicago";

export function formatRecord({ wins, losses }: WinLoss) {
  return `${wins}-${losses}`;
}

export function formatGameDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export function formatKickoffTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
}
