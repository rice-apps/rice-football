import Card from "@/components/ui/Card";
import type { ScheduleGame } from "@/data/mock/home";
import { formatGameDate, formatKickoffTime, formatRecord } from "./format";

type RiceSummaryProps = {
  schedule: ScheduleGame[];
};

function recordFrom(games: ScheduleGame[]) {
  const played = games.filter((game) => game.result);
  const wins = played.filter((game) => game.result!.riceScore > game.result!.opponentScore).length;
  return { wins, losses: played.length - wins };
}

export default function RiceSummary({ schedule }: RiceSummaryProps) {
  // Records are derived from the schedule so the two sections can't disagree.
  const overall = recordFrom(schedule);
  const conference = recordFrom(schedule.filter((game) => game.isConference));
  const nextGame = schedule.find((game) => !game.result);

  const stats = [
    { label: "Overall record", value: formatRecord(overall) },
    { label: "Conference record", value: formatRecord(conference) },
    {
      label: "Next opponent",
      value: nextGame ? nextGame.opponent : "None",
      detail: nextGame ? (nextGame.isHome ? "Home" : "Away") : "Season complete",
    },
    {
      label: "Next game",
      value: nextGame ? formatGameDate(nextGame.kickoff) : "None",
      detail: nextGame ? formatKickoffTime(nextGame.kickoff) : undefined,
    },
  ];

  return (
    <section aria-label="Rice summary" className="home-summary">
      {stats.map((stat) => (
        <Card key={stat.label} className="stat-card">
          <div className="stat-card__label">{stat.label}</div>
          <div className="stat-card__value-wrap home-summary__value-wrap">
            <div className="stat-card__value home-summary__value">{stat.value}</div>
            {stat.detail ? <div className="home-summary__detail">{stat.detail}</div> : null}
          </div>
        </Card>
      ))}
    </section>
  );
}
