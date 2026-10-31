import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import { RICE_TEAM_ID, type StandingsRow } from "@/data/mock/home";
import type { SectionSource } from "@/lib/cfbd/home";
import { formatRecord } from "./format";
import MockBadge from "./MockBadge";

type ConferenceStandingsProps = {
  conference: string;
  standings: StandingsRow[];
  source: SectionSource;
};

export default function ConferenceStandings({ conference, standings, source }: ConferenceStandingsProps) {
  return (
    <Card
      title="Conference standings"
      subtitle={conference}
      actions={source === "mock" ? <MockBadge /> : undefined}
    >
      <Table
        columns={[
          {
            key: "team",
            header: "Team",
            render: (_, row) => (
              <span className="home-standings__team">
                {row.team}
                {row.teamId === RICE_TEAM_ID ? <span className="home-standings__marker">Rice</span> : null}
              </span>
            ),
          },
          { key: "conference", header: "Conf", render: (_, row) => formatRecord(row.conference) },
          { key: "overall", header: "Overall", render: (_, row) => formatRecord(row.overall) },
        ]}
        data={standings}
        emptyMessage={source === "unavailable" ? "Standings are unavailable right now." : undefined}
        getRowKey={(row) => row.teamId}
        getRowClassName={(row) => (row.teamId === RICE_TEAM_ID ? "table__row--highlight" : undefined)}
      />
    </Card>
  );
}
