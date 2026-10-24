import ConferenceStandings from "@/components/home/ConferenceStandings";
import RiceSchedule from "@/components/home/RiceSchedule";
import RiceSummary from "@/components/home/RiceSummary";
import AppShell from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { conferenceStandings, MOCK_CONFERENCE, MOCK_SEASON, riceSchedule } from "@/data/mock/home";

export default function Home() {
  return (
    <AppShell
      eyebrow={`${MOCK_SEASON} season`}
      title="Rice Football Analytics"
      subtitle="Season snapshot for Rice Football staff."
      actions={<Badge variant="badge5">Mock data</Badge>}
    >
      <RiceSummary schedule={riceSchedule} />

      <ConferenceStandings conference={MOCK_CONFERENCE} standings={conferenceStandings} />

      <RiceSchedule season={MOCK_SEASON} schedule={riceSchedule} />
    </AppShell>
  );
}
