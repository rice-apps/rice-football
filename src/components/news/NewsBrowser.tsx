"use client";

import { useState } from "react";
import MockBadge from "@/components/home/MockBadge";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { filterByTopic, type NewsFilter } from "@/lib/news/stories";
import { NEWS_TOPICS, type NewsStory } from "@/types/news";
import NewsStoryItem from "./NewsStoryItem";
import styles from "./news.module.css";

type NewsBrowserProps = {
  stories: NewsStory[]; // already sorted newest first by the page
};

const FILTERS: { value: NewsFilter; label: string }[] = [{ value: "all", label: "All" }, ...NEWS_TOPICS];

function emptyMessage(filter: NewsFilter): string {
  const label = FILTERS.find((entry) => entry.value === filter)?.label ?? "";
  return filter === "all" ? "No news stories right now." : `No ${label.toLowerCase()} stories right now.`;
}

export default function NewsBrowser({ stories }: NewsBrowserProps) {
  const [filter, setFilter] = useState<NewsFilter>("all");
  const visibleStories = filterByTopic(stories, filter);

  return (
    <>
      <div className="inline-actions" role="group" aria-label="Filter by topic">
        {FILTERS.map((entry) => (
          <Button
            key={entry.value}
            size="sm"
            variant={filter === entry.value ? "button1" : "button2"}
            aria-pressed={filter === entry.value}
            onClick={() => setFilter(entry.value)}
          >
            {entry.label}
          </Button>
        ))}
      </div>

      <Card
        title="Latest news"
        subtitle="Sample stories: fictional names, sources, and links"
        actions={<MockBadge />}
      >
        {visibleStories.length > 0 ? (
          <ul className={styles.list}>
            {visibleStories.map((story) => (
              <li key={story.id}>
                <NewsStoryItem story={story} />
              </li>
            ))}
          </ul>
        ) : (
          <div role="status">
            <p className="table-empty">{emptyMessage(filter)}</p>
            {filter !== "all" ? (
              <div className="inline-actions">
                <Button size="sm" variant="button2" onClick={() => setFilter("all")}>
                  Show all stories
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </Card>
    </>
  );
}
