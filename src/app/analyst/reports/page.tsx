"use client";

import { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import ReportCard from "@/components/reports/ReportCard";
import ReportCategoryTabs, {
  type CategoryFilter,
} from "@/components/reports/ReportCategoryTabs";
import { reports } from "@/data/mock/reports";

export default function AnalystReportsPage() {
  const [category, setCategory] = useState<CategoryFilter>("all");

  const visibleReports =
    category === "all"
      ? reports
      : reports.filter((report) => report.category === category);

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
