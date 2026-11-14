import { cleanTags, getTagsError } from "@/lib/reports/tags";
import {
  ALLOWED_EXTENSIONS,
  REPORT_CATEGORIES,
  type ReportCategory,
  type ReportKind,
} from "@/types/report";

// Checks report metadata submissions. Has no server-only code, so the upload
// form can share the same limits and messages as the reports API.

export const REPORT_FIELDS = {
  name: { label: "Report name", maxLength: 200 },
  description: { label: "Description", maxLength: 4000 },
} as const;

const REPORT_KINDS: ReportKind[] = ["static", "runnable"];

/**
 * Metadata accepted for a new report. There is deliberately no file URL or
 * file content: the selected file is not stored, so clients cannot supply one.
 */
export type NewReport = {
  name: string;
  description: string;
  category: ReportCategory;
  kind: ReportKind;
  fileType: string; // lowercase extension, e.g. ".pdf", ".r"
  tags: string[];
};

export type ReportFieldErrors = Partial<Record<keyof NewReport, string>>;

export type ReportValidationResult =
  | { ok: true; value: NewReport }
  | { ok: false; error: string; fieldErrors?: ReportFieldErrors };

/** Lowercases an extension so ".R" and ".r" are stored the same way. */
export function normalizeExtension(extension: string): string {
  return extension.trim().toLowerCase();
}

/** The extension of a file name including the dot, or "" if it has none. */
export function fileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex === -1 ? "" : fileName.slice(dotIndex);
}

/** Whether a report of this kind may use this extension, ignoring case. */
export function isAllowedExtension(kind: ReportKind, extension: string): boolean {
  const normalized = normalizeExtension(extension);
  return ALLOWED_EXTENSIONS[kind].some(
    (allowed) => normalizeExtension(allowed) === normalized,
  );
}

export function isReportCategory(value: unknown): value is ReportCategory {
  return REPORT_CATEGORIES.some((category) => category.value === value);
}

export function isReportKind(value: unknown): value is ReportKind {
  return REPORT_KINDS.some((kind) => kind === value);
}

/**
 * Validates a report metadata submission and returns it cleaned: trimmed text,
 * lowercase extension, and trimmed, deduplicated tags. Unknown fields such as
 * an id, file URL, or timestamps are ignored; the server and database own those.
 */
export function validateNewReport(body: unknown): ReportValidationResult {
  if (!isObject(body)) {
    return { ok: false, error: "Request body must be a JSON object." };
  }

  const fieldErrors: ReportFieldErrors = {};

  const name = readText(body, "name", fieldErrors);
  if (name === "" && !fieldErrors.name) {
    fieldErrors.name = `${REPORT_FIELDS.name.label} is required.`;
  }
  const description = readText(body, "description", fieldErrors);

  const category = isReportCategory(body.category) ? body.category : undefined;
  if (!category) {
    const allowed = REPORT_CATEGORIES.map((item) => item.value).join(", ");
    fieldErrors.category = `Category must be one of: ${allowed}.`;
  }

  const kind = isReportKind(body.kind) ? body.kind : undefined;
  if (!kind) {
    fieldErrors.kind = `Report kind must be one of: ${REPORT_KINDS.join(", ")}.`;
  }

  const fileType = readFileType(body.fileType, kind, fieldErrors);
  const tags = readTags(body.tags, fieldErrors);

  if (!category || !kind || Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Some fields are invalid.", fieldErrors };
  }
  return {
    ok: true,
    value: { name, description, category, kind, fileType, tags },
  };
}

// Returns the trimmed text (missing counts as empty), or records an error and returns "".
function readText(
  body: Record<string, unknown>,
  field: keyof typeof REPORT_FIELDS,
  fieldErrors: ReportFieldErrors,
): string {
  const { label, maxLength } = REPORT_FIELDS[field];
  const value = body[field] ?? "";

  if (typeof value !== "string") {
    fieldErrors[field] = `${label} must be text.`;
    return "";
  }

  const text = value.trim();
  if (text.length > maxLength) {
    fieldErrors[field] = `${label} must be ${maxLength} characters or fewer.`;
  }
  return text;
}

// Returns the lowercase extension. It is only checked against a kind when the kind is valid.
function readFileType(
  value: unknown,
  kind: ReportKind | undefined,
  fieldErrors: ReportFieldErrors,
): string {
  if (typeof value !== "string" || value.trim() === "") {
    fieldErrors.fileType = "File type is required.";
    return "";
  }

  const fileType = normalizeExtension(value);
  if (kind && !isAllowedExtension(kind, fileType)) {
    const label = kind === "static" ? "Static reports" : "Runnable reports";
    fieldErrors.fileType = `${label} must be one of: ${ALLOWED_EXTENSIONS[kind].join(", ")}`;
  }
  return fileType;
}

// Missing tags mean no tags. Otherwise they must be a list of text values within the limits.
function readTags(value: unknown, fieldErrors: ReportFieldErrors): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || !value.every((tag) => typeof tag === "string")) {
    fieldErrors.tags = "Tags must be a list of text values.";
    return [];
  }

  const tags = cleanTags(value);
  const error = getTagsError(tags);
  if (error) fieldErrors.tags = error;
  return tags;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
