import Link from "next/link";
import type { ReactNode } from "react";
import MockBadge from "@/components/home/MockBadge";
import Card from "@/components/ui/Card";
import { newsStories } from "@/data/mock/news";
import type { ScheduleGame } from "@/data/mock/home";
import type { SectionSource } from "@/lib/cfbd/home";
import { findNextOpponent, getNewsToday } from "@/lib/news/nextOpponent";
import { sortNewestFirst, storiesForTeam } from "@/lib/news/stories";
import NewsStoryItem from "./NewsStoryItem";
import styles from "./news.module.css";

type NextOpponentNewsProps = {
  schedule: ScheduleGame[];
  source: SectionSource;
};

const SAMPLE_NOTE = "Sample stories: fictional names, sources, and links";

// Every failure becomes a message so the rest of the homepage still renders.
export default function NextOpponentNews({ schedule, source }: NextOpponentNewsProps) {
  if (source === "unavailable") {
    return <Panel message="Next-opponent news is unavailable because the schedule couldn't be loaded right now." />;
  }

  const next = findNextOpponent(schedule, getNewsToday());

  if (next.kind === "invalid") {
    return <Panel message="We couldn't read the schedule, so we can't tell who Rice plays next." />;
  }

  if (next.kind === "season-over") {
    return <Panel message="Rice has no upcoming games this season, so there's no next opponent to follow." />;
  }

  const { game } = next;
  const stories = sortNewestFirst(storiesForTeam(newsStories, game.opponentId));
  const matchup = `Rice ${game.isHome ? "vs" : "at"} ${game.opponent}`;

  if (stories.length === 0) {
    return <Panel subtitle={matchup} message={`No sample stories about ${game.opponent} yet.`} />;
  }

  return (
    <Panel subtitle={`${matchup} · ${SAMPLE_NOTE}`}>
      <ul className={styles.list}>
        {stories.map((story) => (
          <li key={story.id}>
            <NewsStoryItem story={story} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

type PanelProps = {
  subtitle?: string;
  message?: string;
  children?: ReactNode;
};

function Panel({ subtitle = SAMPLE_NOTE, message, children }: PanelProps) {
  return (
    <Card title="Next opponent news" subtitle={subtitle} actions={<MockBadge />}>
      {message ? <p className="table-empty">{message}</p> : children}
      <Link className={styles.link} href="/news">
        Browse all news
      </Link>
    </Card>
  );
}
