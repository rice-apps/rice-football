// Types for the generic CSV upload prototype (/dev/csv-upload).
// These describe *any* CSV file — nothing here is specific to PFF or another vendor.

/**
 * How serious a problem is.
 * - "error":   the file cannot be previewed at all (empty file, wrong type, no headers).
 * - "warning": the file can still be previewed, but some rows have problems.
 */
export type CsvIssueSeverity = "error" | "warning";

/** A single problem found while checking or parsing a CSV file. */
export type CsvIssue = {
  severity: CsvIssueSeverity;
  /** Plain-English explanation shown to the user. */
  message: string;
  /**
   * Line number in the original file (1 = the first line), matching what you
   * would see in a text editor. Omitted for whole-file problems like "file is empty".
   */
  line?: number;
};

/** One data row from the file, plus where it came from. */
export type CsvRow = {
  /** Line number in the original file, so warnings can point at it. */
  line: number;
  /** The row's cell values, in column order. */
  cells: string[];
};

/** The result of parsing and validating one CSV file. */
export type CsvParseResult = {
  /** Column names taken from the first non-blank line of the file. */
  headers: string[];
  /** Every data row (header line and blank lines excluded). */
  rows: CsvRow[];
  /** All problems found, both errors and warnings. */
  issues: CsvIssue[];
};
