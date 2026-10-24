import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import ReportCard from "@/components/reports/ReportCard";
import { reports } from "@/data/mock/reports";

export default function AnalystReportsPage() {
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
      <div className="page-grid">
        {reports.map((report) => (
          <ReportCard key={report.id} report={report} />
        ))}
      </div>
    </AppShell>
  );
}
