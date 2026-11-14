"use client";

import { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import ReportCard from "@/components/reports/ReportCard";
import ReportCategoryTabs, {
  type CategoryFilter,
} from "@/components/reports/ReportCategoryTabs";
import { matchesReportQuery } from "@/components/reports/searchReports";
import { Input } from "@/components/ui/Input";
import { reports } from "@/data/mock/reports";

export default function AnalystReportsPage() {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");

  const visibleReports = reports.filter(
    (report) =>
      (category === "all" || report.category === category) &&
      matchesReportQuery(report, query),
  );

  return (
    <AppShell
      title="Report Library"
      subtitle="Browse and manage analyst reports by category."
      actions={
        <Link
          href="/analyst/reports/upload"
          className="ui-button ui-button--button1 ui-button--sm"
        >
          Upload Report
        </Link>
      }
    >
      <ReportCategoryTabs selected={category} onSelect={setCategory} />

      <Input
        type="search"
        label="Search reports"
        placeholder="Search by name, description, or tag"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {visibleReports.length > 0 ? (
        <div className="page-grid">
          {visibleReports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      ) : (
        <p className="ui-field__hint">No reports in this category yet.</p>
      )}
    </AppShell>
  );
}
