import AppShell from "@/components/layout/AppShell";
import ReportLibrary from "@/components/reports/ReportLibrary";

export default function ReportsPage() {
  return (
    <AppShell
      title="Reports"
      subtitle="Browse finished reports shared by the analytics team."
    >
      <ReportLibrary audience="staff" />
    </AppShell>
  );
}
