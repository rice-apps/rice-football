import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import ReportUploadForm from "@/components/reports/ReportUploadForm";

export default function UploadReportPage() {
  return (
    <AppShell
      title="Upload Report"
      subtitle="Add a static or runnable report to the library."
      actions={
        <Link
          href="/analyst/reports"
          className="ui-button ui-button--button2 ui-button--sm"
        >
          Back to library
        </Link>
      }
    >
      <ReportUploadForm />
    </AppShell>
  );
}
