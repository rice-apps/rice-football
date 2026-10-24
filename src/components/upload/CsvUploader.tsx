"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { parseCsv } from "@/lib/csv/parseCsv";
import { validateCsvContent, validateCsvFile } from "@/lib/csv/validateCsv";
import type { CsvIssue, CsvParseResult } from "@/types/csv";
import { CsvPreviewTable } from "./CsvPreviewTable";
import styles from "./CsvUploader.module.css";

const PREVIEW_ROW_LIMIT = 50;
const MAX_ISSUES_SHOWN = 20;

/** Everything we know about the most recently chosen file. */
type UploadResult = CsvParseResult & { fileName: string };

/**
 * Lets the user choose or drag in a CSV file, then shows its columns,
 * a preview of the first rows, and any problems found.
 * Everything happens in the browser; nothing is uploaded to a server.
 */
export function CsvUploader() {
  // --- State: values that, when changed, make React redraw the component ---
  const [result, setResult] = useState<UploadResult | null>(null); // null = no file chosen yet
  const [isReading, setIsReading] = useState(false); // true while the file is being read
  const [isDragging, setIsDragging] = useState(false); // true while a file is dragged over the drop zone

  // The most recently chosen file. A ref (not state) because changing it shouldn't redraw anything.
  // Used to ignore a slow, older file read that finishes after a newer file was chosen.
  const latestFileRef = useRef<File | null>(null);

  async function handleFile(file: File) {
    latestFileRef.current = file;

    // 1. Check the file itself before reading it.
    const fileIssues = validateCsvFile(file);
    if (hasErrors(fileIssues)) {
      setIsReading(false); // In case an older file was still being read.
      setResult({ fileName: file.name, headers: [], rows: [], issues: fileIssues });
      return;
    }

    // 2. Read the file's text. This is asynchronous: the browser does it in the background.
    setIsReading(true);
    let text: string;
    try {
      text = await file.text();
    } catch {
      text = "";
      fileIssues.push({ severity: "error", message: "The file could not be read. Please try choosing it again." });
    }
    if (latestFileRef.current !== file) return; // A newer file was chosen while this one was reading.
    setIsReading(false);

    if (hasErrors(fileIssues)) {
      setResult({ fileName: file.name, headers: [], rows: [], issues: fileIssues });
      return;
    }

    // 3. Parse, then 4. validate the contents.
    const parsed = parseCsv(text);
    const contentIssues = hasErrors(parsed.issues) ? [] : validateCsvContent(parsed);

    setResult({
      fileName: file.name,
      headers: parsed.headers,
      rows: parsed.rows,
      issues: [...fileIssues, ...parsed.issues, ...contentIssues],
    });
  }

  // --- File picker ---
  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
    // Clear the input so choosing the same file again still triggers onChange.
    event.target.value = "";
  }

  // --- Drag and drop ---
  function handleDragEnter(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    // Required: without preventDefault here, the browser refuses the drop
    // and opens the file in the tab instead.
    event.preventDefault();
  }

  function handleDragLeave(event: DragEvent<HTMLElement>) {
    // dragleave also fires when moving between the drop zone's own child elements.
    // Only stop highlighting when the pointer has really left the drop zone.
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault(); // Stop the browser from opening the file.
    setIsDragging(false);
    const file = event.dataTransfer.files[0]; // If several files are dropped, use the first.
    if (file) handleFile(file);
  }

  const canPreview = result !== null && !hasErrors(result.issues);

  return (
    <div className={styles.uploader}>
      <label
        className={isDragging ? `${styles.dropZone} ${styles.dragging}` : styles.dropZone}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Visually hidden but still focusable, so keyboard users can open the file picker. */}
        <input type="file" accept=".csv,text/csv" className={styles.hiddenInput} onChange={handleInputChange} />
        <span className={styles.dropZoneTitle}>Drag a CSV file here, or click to choose one</span>
        <span className={styles.hint}>
          Up to 5 MB. The first {PREVIEW_ROW_LIMIT} rows are previewed.
        </span>
      </label>

      {/* aria-live: screen readers announce changes in this area (e.g. new results). */}
      <div aria-live="polite">
        {isReading && <p className={styles.status}>Reading file…</p>}

        {result && !isReading && (
          <section className={styles.results}>
            <p className={styles.summary}>
              <strong>{result.fileName}</strong>
              {canPreview
                ? ` · ${countLabel(result.headers.length, "column")} · ${countLabel(result.rows.length, "data row")}`
                : " · could not be previewed"}
            </p>

            {result.issues.length > 0 && <IssueList issues={result.issues} />}

            {canPreview && (
              <>
                <p className={styles.columns}>
                  <strong>Detected columns:</strong> {result.headers.map((h, i) => h || `(column ${i + 1})`).join(", ")}
                </p>
                {result.rows.length > PREVIEW_ROW_LIMIT && (
                  <p className={styles.hint}>
                    Showing the first {PREVIEW_ROW_LIMIT} of {result.rows.length} rows.
                  </p>
                )}
                <CsvPreviewTable headers={result.headers} rows={result.rows.slice(0, PREVIEW_ROW_LIMIT)} />
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function IssueList({ issues }: { issues: CsvIssue[] }) {
  const shown = issues.slice(0, MAX_ISSUES_SHOWN);
  const hiddenCount = issues.length - shown.length;

  return (
    <ul className={styles.issueList}>
      {shown.map((issue, index) => (
        <li key={index} className={issue.severity === "error" ? styles.error : styles.warning}>
          <strong>{issue.severity === "error" ? "Error" : "Warning"}</strong>
          {issue.line !== undefined && ` (line ${issue.line})`}: {issue.message}
        </li>
      ))}
      {hiddenCount > 0 && <li className={styles.more}>…and {hiddenCount} more</li>}
    </ul>
  );
}

/** e.g. countLabel(1, "column") → "1 column", countLabel(3, "column") → "3 columns" */
function countLabel(count: number, singular: string): string {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

function hasErrors(issues: CsvIssue[]): boolean {
  return issues.some((issue) => issue.severity === "error");
}
