"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import ReportCard from "@/components/reports/ReportCard";
import ReportCategoryTabs, {
  type CategoryFilter,
} from "@/components/reports/ReportCategoryTabs";
import { reports } from "@/data/mock/reports";

export default function ReportsPage() {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const staticReports = reports.filter((report) => report.kind === "static");
  const visibleReports = staticReports.filter(
    (report) => category === "all" || report.category === category,
  );

  return (
    <AppShell
      title="Reports"
      subtitle="Browse finished reports shared by the analytics team."
    >
      <ReportCategoryTabs selected={category} onSelect={setCategory} />

      {visibleReports.length > 0 ? (
        <div className="page-grid">
          {visibleReports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      ) : (
        <p className="ui-field__hint" role="status">
          No reports in this category yet.
        </p>
      )}
    </AppShell>
  );
}
