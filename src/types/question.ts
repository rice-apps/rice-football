// Staff Q&A types. Questions are stored in the Supabase `questions` table;
// src/lib/questions/db.ts converts database rows into this shape.

export type QuestionStatus = "open" | "in-progress" | "answered";

export type Question = {
  id: number; // database id
  submittedBy: string;
  submitterTitle: string;
  text: string;
  status: QuestionStatus;
  answer: string | null;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
};

export const QUESTION_STATUSES: QuestionStatus[] = ["open", "in-progress", "answered"];

export function isQuestionStatus(value: unknown): value is QuestionStatus {
  return typeof value === "string" && (QUESTION_STATUSES as string[]).includes(value);
}
