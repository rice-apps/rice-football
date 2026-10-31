import { Badge } from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import type { ScheduleGame } from "@/data/mock/home";
import { formatGameDate } from "./format";

type RiceScheduleProps = {
  season: number;
  schedule: ScheduleGame[];
};

function ResultCell({ game }: { game: ScheduleGame }) {
  if (!game.result) return <Badge variant="badge1">Upcoming</Badge>;

  const { riceScore, opponentScore } = game.result;
  const won = riceScore > opponentScore;

  return (
    <span className="home-schedule__result">
      <Badge variant={won ? "badge4" : "badge6"}>{won ? "W" : "L"}</Badge>
      {riceScore}-{opponentScore}
    </span>
  );
}

export default function RiceSchedule({ season, schedule }: RiceScheduleProps) {
  return (
    <Card title="Rice schedule" subtitle={`${season} season`}>
      <Table
        columns={[
          { key: "week", header: "Week" },
          { key: "kickoff", header: "Date", render: (_, row) => formatGameDate(row.kickoff) },
          {
            key: "opponent",
            header: "Opponent",
            render: (_, row) => `${row.isHome ? "vs" : "at"} ${row.opponent}`,
          },
          {
            key: "isHome",
            header: "Home/Away",
            render: (_, row) => (
              <Badge variant={row.isHome ? "badge2" : "badge1"}>{row.isHome ? "Home" : "Away"}</Badge>
            ),
          },
          { key: "result", header: "Result", render: (_, row) => <ResultCell game={row} /> },
        ]}
        data={schedule}
      />
    </Card>
  );
}
