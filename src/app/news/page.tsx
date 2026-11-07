import AppShell from "@/components/layout/AppShell";
import NewsBrowser from "@/components/news/NewsBrowser";
import { newsStories } from "@/data/mock/news";
import { sortNewestFirst } from "@/lib/news/stories";

export default function NewsPage() {
  return (
    <AppShell
      title="News"
      subtitle="General and conference, recruiting, and transfer portal news. Prototype showing sample stories only."
    >
      {/* Sorted once on the server; the browser only filters. */}
      <NewsBrowser stories={sortNewestFirst(newsStories)} />
    </AppShell>
  );
}
