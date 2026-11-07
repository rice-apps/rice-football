import type { Report } from "@/types/report";

// Case-insensitive keyword match over a report's name, description, and tags.
// An empty or whitespace-only query matches every report.
export function matchesReportQuery(report: Report, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return (
    report.name.toLowerCase().includes(normalized) ||
    report.description.toLowerCase().includes(normalized) ||
    report.tags.some((tag) => tag.toLowerCase().includes(normalized))
  );
}
