import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import ReportLibrary from "@/components/reports/ReportLibrary";

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
      <ReportLibrary audience="analyst" />
    </AppShell>
  );
}
