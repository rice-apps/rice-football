import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { NEWS_TEAM_NAMES } from "@/data/mock/news";
import { formatEventDate, formatPublishedAt } from "@/lib/news/stories";
import { EVENT_DATE_LABELS, NEWS_TOPICS, type NewsStory, type NewsTopic } from "@/types/news";
import styles from "./news.module.css";

type NewsStoryItemProps = {
  story: NewsStory;
};

const TOPIC_BADGES: Record<NewsTopic, BadgeVariant> = {
  general: "badge1",
  recruiting: "badge4",
  "transfer-portal": "badge3",
};

// Fixture links must stay on example.com; anything else is hidden so a real
// publisher URL added by mistake never goes live.
const SAMPLE_LINK_PREFIX = "https://example.com/";

function topicLabel(topic: NewsTopic): string {
  return NEWS_TOPICS.find((entry) => entry.value === topic)?.label ?? topic;
}

export default function NewsStoryItem({ story }: NewsStoryItemProps) {
  const eventDate = formatEventDate(story.eventDate);
  const showLink = story.sourceUrl.startsWith(SAMPLE_LINK_PREFIX);

  return (
    <article className={styles.story}>
      <div className={styles.tags}>
        <Badge variant="badge2">{NEWS_TEAM_NAMES[story.team] ?? story.team}</Badge>
        <Badge variant={TOPIC_BADGES[story.topic]}>{topicLabel(story.topic)}</Badge>
      </div>

      <h3 className={styles.headline}>{story.headline}</h3>

      <div className={styles.meta}>
        <span className={styles.source}>{story.sourceName}</span>
        <span>Published {formatPublishedAt(story.publishedAt)}</span>
        {eventDate ? (
          <span>
            {EVENT_DATE_LABELS[story.topic]} {eventDate}
          </span>
        ) : null}
      </div>

      {showLink ? (
        <a className={styles.link} href={story.sourceUrl} target="_blank" rel="noreferrer">
          Sample link (example.com)
        </a>
      ) : null}
    </article>
  );
}
