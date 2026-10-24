import type { CsvRow } from "@/types/csv";
import styles from "./CsvPreviewTable.module.css";

type CsvPreviewTableProps = {
  headers: string[];
  /** The rows to show. The caller decides how many (e.g. the first 50). */
  rows: CsvRow[];
};

/**
 * Displays CSV headers and rows as a scrollable table.
 * It only displays what it is given; it does no parsing or validation.
 */
export function CsvPreviewTable({ headers, rows }: CsvPreviewTableProps) {
  // Use the widest of the header and the rows, so a row with extra values
  // still shows every value instead of silently cutting them off.
  const columnCount = Math.max(headers.length, ...rows.map((row) => row.cells.length));
  const columnIndexes = Array.from({ length: columnCount }, (_, index) => index);

  return (
    <div className={styles.scrollArea}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.lineNumber}>Line</th>
            {columnIndexes.map((index) => (
              <th key={index}>{columnLabel(headers, index)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.line}
              // Highlight rows whose value count doesn't match the header.
              className={row.cells.length !== headers.length ? styles.mismatchedRow : undefined}
            >
              <td className={styles.lineNumber}>{row.line}</td>
              {columnIndexes.map((index) => (
                <td key={index} title={row.cells[index]}>
                  {row.cells[index] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function columnLabel(headers: string[], index: number): string {
  if (index >= headers.length) return "(extra)";
  return headers[index] === "" ? `(column ${index + 1})` : headers[index];
}
