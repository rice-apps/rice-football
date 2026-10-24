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
        <Badge variant={isRunnable ? "badge2" : "badge1"}>
          {isRunnable ? "Runnable" : "Static"}
        </Badge>
      }
    >
      <div className={styles.meta}>
        <span>{categoryLabel(report.category)}</span>
        <span className={styles.fileType}>{report.fileType}</span>
        <span>Added {formatDate(report.createdAt)}</span>
      </div>
    </Card>
  );
}
