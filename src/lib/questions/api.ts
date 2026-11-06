import type { FieldErrors, NewQuestion, QuestionUpdate } from "@/lib/questions/validation";
import type { Question } from "@/types/question";

// Browser helpers for the questions API (src/app/api/questions). A failed request throws a
// QuestionApiError with the server's message and field errors, ready to show on the page.

export class QuestionApiError extends Error {
  fieldErrors: FieldErrors;

  constructor(message: string, fieldErrors: FieldErrors = {}) {
    super(message);
    this.name = "QuestionApiError";
    this.fieldErrors = fieldErrors;
  }
}

/** All questions, newest first. */
export async function fetchQuestions(): Promise<Question[]> {
  const { questions } = await request<{ questions: Question[] }>("GET", "/api/questions");
  return questions;
}

/** Submits a staff question and returns it as saved (with its id, status, and timestamps). */
export async function submitQuestion(question: NewQuestion): Promise<Question> {
  const { question: saved } = await request<{ question: Question }>("POST", "/api/questions", question);
  return saved;
}

/** Updates a question's status and/or answer and returns it as saved. */
export async function patchQuestion(id: number, update: QuestionUpdate): Promise<Question> {
  const { question } = await request<{ question: Question }>("PATCH", `/api/questions/${id}`, update);
  return question;
}

/** A message that's safe to show the user for any error thrown by these helpers. */
export function getErrorMessage(error: unknown): string {
  return error instanceof QuestionApiError ? error.message : "Something went wrong. Please try again.";
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new QuestionApiError("Couldn't reach the server. Check your connection and try again.");
  }

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const { error, fieldErrors } = (data ?? {}) as { error?: string; fieldErrors?: FieldErrors };
    throw new QuestionApiError(error ?? `Request failed (${response.status}). Please try again.`, fieldErrors);
  }
  return data as T;
}
