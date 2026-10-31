import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import { RICE_TEAM_ID, type StandingsRow } from "@/data/mock/home";
import { formatRecord } from "./format";

type ConferenceStandingsProps = {
  conference: string;
  standings: StandingsRow[];
};

export default function ConferenceStandings({ conference, standings }: ConferenceStandingsProps) {
  return (
    <Card title="Conference standings" subtitle={conference}>
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
        getRowKey={(row) => row.teamId}
        getRowClassName={(row) => (row.teamId === RICE_TEAM_ID ? "table__row--highlight" : undefined)}
      />
    </Card>
  );
}
