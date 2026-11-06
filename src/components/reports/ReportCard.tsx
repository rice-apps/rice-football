import { Badge } from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { REPORT_CATEGORIES, type Report } from "@/types/report";
import styles from "./ReportCard.module.css";

type ReportCardProps = {
  report: Report;
};

function categoryLabel(category: Report["category"]): string {
  return (
    REPORT_CATEGORIES.find((entry) => entry.value === category)?.label ??
    category
  );
}

// One label per file type: what the report actually is, instead of a generic
// "static"/"runnable" tag. Kind is still conveyed by the badge color.
const FILE_TYPE_LABELS: Record<string, string> = {
  ".pdf": "PDF",
  ".csv": "CSV",
  ".html": "HTML",
  ".r": "R script",
  ".py": "Python script",
};

function fileTypeLabel(fileType: string): string {
  return (
    FILE_TYPE_LABELS[fileType.toLowerCase()] ??
    fileType.replace(".", "").toUpperCase()
  );
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ReportCard({ report }: ReportCardProps) {
  const isRunnable = report.kind === "runnable";

  return (
    <Card
      title={report.name}
      subtitle={report.description}
      actions={
        <Badge
          variant={isRunnable ? "badge2" : "badge1"}
          title={isRunnable ? "Runnable report" : "Static report"}
        >
          {fileTypeLabel(report.fileType)}
        </Badge>
      }
    >
      <div className={styles.meta}>
        <span>{categoryLabel(report.category)}</span>
        <span>Added {formatDate(report.createdAt)}</span>
      </div>
      {report.fileUrl ? (
        <div className={styles.actions}>
          <a
            className="ui-button ui-button--button2 ui-button--sm"
            href={report.fileUrl}
            {...(report.fileType.toLowerCase() === ".csv"
              ? { download: true }
              : { target: "_blank", rel: "noreferrer" })}
          >
            {report.fileType.toLowerCase() === ".csv"
              ? "Download CSV"
              : "Open report"}
          </a>
        </div>
      ) : null}
    </Card>
  );
}
