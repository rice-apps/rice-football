import type { CsvIssue, CsvParseResult } from "@/types/csv";

export const MAX_CSV_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Checks a file before reading it: extension, emptiness, and size.
 *
 * Takes only `name` and `size` (both of which a browser File has), so it can
 * also be called with a plain object, e.g. in a test.
 */
export function validateCsvFile(file: { name: string; size: number }): CsvIssue[] {
  const issues: CsvIssue[] = [];

  // We check the extension instead of file.type, because browsers report CSV
  // types inconsistently (on Windows with Excel it is often "application/vnd.ms-excel").
  if (!file.name.toLowerCase().endsWith(".csv")) {
    issues.push({
      severity: "error",
      message: `"${file.name}" is not a .csv file. Please choose a file ending in .csv.`,
    });
  }

  if (file.size === 0) {
    issues.push({ severity: "error", message: "The file is empty (0 bytes)." });
  } else if (file.size > MAX_CSV_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / 1024 / 1024).toFixed(1);
    issues.push({
      severity: "error",
      message: `The file is ${sizeMb} MB. The limit for this preview is 5 MB.`,
    });
  }

  return issues;
}

/**
 * Checks the parsed contents: is there anything there, does the first line
 * look like headers, and does every row have the same number of columns?
 *
 * Returns only the new issues it finds (the parser's own issues are already
 * in `parsed.issues`).
 */
export function validateCsvContent(parsed: CsvParseResult): CsvIssue[] {
  const { headers, rows } = parsed;

  // parseCsv skips blank lines, so no headers means no non-blank lines at all.
  if (headers.length === 0) {
    return [
      { severity: "error", message: "The file has no content. It is empty or contains only blank lines." },
    ];
  }

  const issues: CsvIssue[] = [];

  // A CSV can't say whether its first line is headers or data. If every named cell in
  // the first line is a number, it may be data, so we warn. Only a warning, because
  // numeric column names are legitimate (e.g. seasons: 2023,2024,2025).
  const namedHeaders = headers.filter((header) => header !== "");
  if (namedHeaders.every(isNumber)) {
    issues.push({
      severity: "warning",
      message: `Every column name in the first line (${headers.join(", ")}) is a number. If that line is data rather than column names, add a header line.`,
    });
  }

  // Blank column names are only a warning: some tools (e.g. pandas) write an unnamed first column.
  headers.forEach((header, index) => {
    if (header === "") {
      issues.push({ severity: "warning", message: `Column ${index + 1} has no name.` });
    }
  });

  // Duplicate column names make it ambiguous which column someone means.
  const seen = new Map<string, number>(); // column name → first column number
  headers.forEach((header, index) => {
    if (header === "") return;
    const firstColumn = seen.get(header);
    if (firstColumn === undefined) {
      seen.set(header, index + 1);
    } else {
      issues.push({
        severity: "warning",
        message: `Column name "${header}" is used more than once (columns ${firstColumn} and ${index + 1}).`,
      });
    }
  });

  if (rows.length === 0) {
    issues.push({ severity: "warning", message: "The file has a header line but no data rows." });
  }

  for (const row of rows) {
    if (row.cells.length !== headers.length) {
      issues.push({
        severity: "warning",
        message: `This row has ${row.cells.length} ${row.cells.length === 1 ? "value" : "values"}, but ${headers.length === 1 ? "there is 1 column" : `there are ${headers.length} columns`}.`,
        line: row.line,
      });
    }
  }

  return issues;
}

function isNumber(value: string): boolean {
  const trimmed = value.trim();
  return trimmed !== "" && !Number.isNaN(Number(trimmed));
}
