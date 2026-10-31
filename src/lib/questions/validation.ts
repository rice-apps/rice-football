import { isQuestionStatus, QUESTION_STATUSES, type QuestionStatus } from "@/types/question";

// Checks request bodies for the questions API. Has no server-only code, so the staff form can share the same limits and messages.

export const QUESTION_FIELDS = {
  submittedBy: { label: "Name", maxLength: 100 },
  submitterTitle: { label: "Role / title", maxLength: 100 },
  text: { label: "Question", maxLength: 2000 },
  answer: { label: "Answer", maxLength: 2000 },
} as const;

export type NewQuestion = {
  submittedBy: string;
  submitterTitle: string;
  text: string;
};

// Only the fields that are present get updated.
export type QuestionUpdate = {
  status?: QuestionStatus;
  answer?: string | null;
};

export type FieldErrors = Partial<Record<keyof typeof QUESTION_FIELDS | "status", string>>;

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

const NOT_AN_OBJECT = "Request body must be a JSON object.";
const INVALID_FIELDS = "Some fields are invalid.";

/** Validates a staff submission. Status and answer can't be set when submitting. */
export function validateNewQuestion(body: unknown): ValidationResult<NewQuestion> {
  if (!isObject(body)) return { ok: false, error: NOT_AN_OBJECT };

  const fieldErrors: FieldErrors = {};
  const question = {
    submittedBy: readRequiredText(body, "submittedBy", fieldErrors),
    submitterTitle: readRequiredText(body, "submitterTitle", fieldErrors),
    text: readRequiredText(body, "text", fieldErrors),
  };

  return hasErrors(fieldErrors)
    ? { ok: false, error: INVALID_FIELDS, fieldErrors }
    : { ok: true, value: question };
}

/** Validates an analyst update. A null or blank answer clears the saved answer. */
export function validateQuestionUpdate(body: unknown): ValidationResult<QuestionUpdate> {
  if (!isObject(body)) return { ok: false, error: NOT_AN_OBJECT };
  if (!("status" in body) && !("answer" in body)) {
    return { ok: false, error: "Provide a status or an answer to update." };
  }

  const fieldErrors: FieldErrors = {};
  const update: QuestionUpdate = {};

  if ("status" in body) {
    if (isQuestionStatus(body.status)) update.status = body.status;
    else fieldErrors.status = `Status must be one of: ${QUESTION_STATUSES.join(", ")}.`;
  }

  if ("answer" in body) {
    const answer = body.answer ?? "";
    const { maxLength } = QUESTION_FIELDS.answer;
    if (typeof answer !== "string") fieldErrors.answer = "Answer must be text.";
    else if (answer.trim().length > maxLength) fieldErrors.answer = `Answer must be ${maxLength} characters or fewer.`;
    else update.answer = answer.trim() || null;
  }

  return hasErrors(fieldErrors)
    ? { ok: false, error: INVALID_FIELDS, fieldErrors }
    : { ok: true, value: update };
}

/** Returns the numeric database id, or null if `id` isn't a positive whole number. */
export function parseQuestionId(id: string): number | null {
  const parsed = Number(id);
  return /^\d+$/.test(id) && Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

// Returns the trimmed text, or records an error and returns "" (unused once there are errors).
function readRequiredText(
  body: Record<string, unknown>,
  field: "submittedBy" | "submitterTitle" | "text",
  fieldErrors: FieldErrors,
): string {
  const { label, maxLength } = QUESTION_FIELDS[field];
  const value = body[field] ?? "";

  if (typeof value !== "string") {
    fieldErrors[field] = `${label} must be text.`;
    return "";
  }

  const text = value.trim();
  if (text === "") fieldErrors[field] = `${label} is required.`;
  else if (text.length > maxLength) fieldErrors[field] = `${label} must be ${maxLength} characters or fewer.`;
  return text;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasErrors(fieldErrors: FieldErrors): boolean {
  return Object.keys(fieldErrors).length > 0;
}
