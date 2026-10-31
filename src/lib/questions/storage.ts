import { mockQuestions } from "@/data/mock/questions";
import { isQuestionStatus, type Question } from "@/types/question";

// Lets a question submitted on /questions show up on /analyst/questions.
// Demo only: data lives in this browser, not a backend.

const STORAGE_KEY = "rice-football:staff-qa:questions:v1";

function isQuestion(value: unknown): value is Question {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.submittedBy === "string" &&
    typeof candidate.submitterTitle === "string" &&
    typeof candidate.text === "string" &&
    isQuestionStatus(candidate.status) &&
    typeof candidate.createdAt === "string" &&
    !Number.isNaN(Date.parse(candidate.createdAt))
  );
}

// Every localStorage access is wrapped in try/catch: it throws on the server
// (no window), when site data is blocked, and when storage is full.

/** Saved questions, or the mock questions if nothing valid is saved. Never throws. */
export function loadQuestions(): Question[] {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      // Drop bad records instead of discarding every submitted question.
      const valid = Array.isArray(parsed) ? parsed.filter(isQuestion) : [];
      if (valid.length > 0) return valid;
    }
  } catch {
    // Fall back to the mock questions below.
  }
  return mockQuestions;
}

/** Returns false if the questions could not be saved. */
export function saveQuestions(questions: Question[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
    return true;
  } catch {
    return false;
  }
}

export function resetQuestions(): Question[] {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
  return mockQuestions;
}

// The browser only fires "storage" events in other tabs, not the one that wrote.
export function onQuestionsChangedInOtherTab(callback: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}
