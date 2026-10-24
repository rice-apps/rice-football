import Papa, { type ParseError } from "papaparse";
import type { CsvIssue, CsvParseResult, CsvRow } from "@/types/csv";

// Plain-English versions of the problems PapaParse can report for comma-separated text.
const PARSER_MESSAGES: Partial<Record<ParseError["code"], string>> = {
  MissingQuotes:
    'A quoted cell is never closed (a closing " is missing), so everything after it may have been read as a single cell.',
  InvalidQuotes: 'A cell has a " character in an unexpected place.',
};

/**
 * Turns the text of a CSV file into headers and rows.
 *
 * - Takes a string (not a File), so it works anywhere: browser, server, scripts, tests.
 * - Treats the first non-blank line as the headers and skips blank lines.
 * - Never throws. Parser problems are returned in `issues` as warnings.
 *
 * This only reads the file. Deciding whether the result is acceptable
 * (empty file, missing headers, wrong column counts) is done in validateCsv.ts.
 */
export function parseCsv(text: string): CsvParseResult {
  const nonBlankRows: CsvRow[] = [];
  const issues: CsvIssue[] = [];

  // Where the current row begins: as a character position, and as a line number.
  let rowStart = 0;
  let rowStartLine = 1;

  try {
    Papa.parse<string[]>(text, {
      // header: false → each row comes back as a list of cells; we pick out the headers ourselves.
      header: false,
      // delimiter: "," → always split on commas instead of letting PapaParse guess.
      delimiter: ",",
      // step runs once per row, in order (and synchronously, because the input is a string).
      step: (result) => {
        const cells = result.data;
        if (cells.some((cell) => cell.trim() !== "")) {
          nonBlankRows.push({ line: rowStartLine, cells });
        }

        for (const error of result.errors) {
          issues.push({
            severity: "warning",
            message: PARSER_MESSAGES[error.code] ?? `The CSV parser reported a problem: ${error.message}`,
            line: rowStartLine,
          });
        }

        // meta.cursor is the character position just after this row. Counting the line
        // breaks up to there (including any inside quoted cells) gives the next row's line.
        const rowEnd = result.meta.cursor;
        rowStartLine += countLineBreaks(text, rowStart, rowEnd);
        rowStart = rowEnd;
      },
    });
  } catch {
    return {
      headers: [],
      rows: [],
      issues: [{ severity: "error", message: "This file could not be read as CSV." }],
    };
  }

  const [headerRow, ...dataRows] = nonBlankRows;

  return {
    headers: headerRow ? headerRow.cells.map((header) => header.trim()) : [],
    rows: dataRows,
    issues,
  };
}

function countLineBreaks(text: string, start: number, end: number): number {
  let count = 0;
  for (let i = start; i < end; i++) {
    if (text[i] === "\n") count++;
  }
  return count;
}
