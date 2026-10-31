import { Suspense } from "react";
import ConferenceStandings from "@/components/home/ConferenceStandings";
import RiceSchedule from "@/components/home/RiceSchedule";
import RiceSummary from "@/components/home/RiceSummary";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import { currentSeason, getHomeData } from "@/lib/cfbd/home";

// Rebuild the page with fresh CFBD data at most once an hour instead of calling CFBD on every visit.
export const revalidate = 3600;

const CONFERENCE_NAME = "American Athletic Conference";

export default function Home() {
  return (
    <AppShell
      eyebrow={`${currentSeason()} season`}
      title="Rice Football Analytics"
      subtitle="Season snapshot for Rice Football staff."
    >
      <Suspense fallback={<HomeLoading />}>
        <HomeSections />
      </Suspense>
    </AppShell>
  );
}

// Runs on the server, so the CFBD key never reaches the browser.
async function HomeSections() {
  const { season, schedule, standings } = await getHomeData();

  return (
    <>
      <RiceSummary schedule={schedule.data} source={schedule.source} />
      <ConferenceStandings conference={CONFERENCE_NAME} standings={standings.data} source={standings.source} />
      <RiceSchedule season={season} schedule={schedule.data} source={schedule.source} />
    </>
  );
}

function HomeLoading() {
  return (
    <Card>
      <p className="table-empty">Loading the latest Rice data…</p>
    </Card>
  );
}
