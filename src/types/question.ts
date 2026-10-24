// Staff Q&A prototype types. Local/mock only; not a production schema.

export type QuestionStatus = "open" | "in-progress" | "answered";

export type Question = {
  id: string;
  submittedBy: string;
  submitterTitle: string;
  text: string;
  status: QuestionStatus;
  createdAt: string; // ISO date string
};

export const QUESTION_STATUSES: QuestionStatus[] = ["open", "in-progress", "answered"];

export function isQuestionStatus(value: unknown): value is QuestionStatus {
  return typeof value === "string" && (QUESTION_STATUSES as string[]).includes(value);
}
