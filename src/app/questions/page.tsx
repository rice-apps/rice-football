"use client";

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import AppShell from "@/components/layout/AppShell";
import QuestionList from "@/components/questions/QuestionList";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { fetchQuestions, getErrorMessage, QuestionApiError, submitQuestion } from "@/lib/questions/api";
import { QUESTION_FIELDS, type FieldErrors, type NewQuestion } from "@/lib/questions/validation";
import type { Question } from "@/types/question";

// Name and title are typed manually for now; they will come from auth later.
// The server validates submissions; this page shows its messages under each field.

type FieldName = keyof NewQuestion;
type Feedback = { kind: "success" | "error"; message: string } | null;
type ListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; questions: Question[] };

export default function AskQuestionPage() {
  const [values, setValues] = useState<NewQuestion>({ submittedBy: "", submitterTitle: "", text: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [submitting, setSubmitting] = useState(false);
  const [list, setList] = useState<ListState>({ status: "loading" });

  const loadQuestions = useCallback(() => {
    fetchQuestions().then(
      (questions) => setList({ status: "ready", questions }),
      (error: unknown) => setList({ status: "error", message: getErrorMessage(error) }),
    );
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  function handleRetry() {
    setList({ status: "loading" });
    loadQuestions();
  }

  function handleFieldChange(field: FieldName) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
      setFeedback(null);
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFeedback(null);

    try {
      const question = await submitQuestion(values);
      setFeedback({ kind: "success", message: "Thanks! Your question was sent to the analytics team." });
      // Keep name and title so the same person can ask a follow-up quickly.
      setValues((current) => ({ ...current, text: "" }));
      // Show it at the top of the list right away.
      setList((current) =>
        current.status === "ready" ? { status: "ready", questions: [question, ...current.questions] } : current,
      );
    } catch (error) {
      if (error instanceof QuestionApiError) setErrors(error.fieldErrors);
      setFeedback({ kind: "error", message: getErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="Ask the Analytics Team" subtitle="Send a question to Rice Football's analysts.">
      <Card title="New question" subtitle="All fields are required.">
        <form className="stacked-form" onSubmit={handleSubmit} noValidate>
          <Input
            label="Your name"
            autoComplete="name"
            value={values.submittedBy}
            onChange={handleFieldChange("submittedBy")}
            maxLength={QUESTION_FIELDS.submittedBy.maxLength}
            error={errors.submittedBy}
          />
          <Input
            label="Role / title"
            placeholder="e.g. Offensive Coordinator"
            value={values.submitterTitle}
            onChange={handleFieldChange("submitterTitle")}
            maxLength={QUESTION_FIELDS.submitterTitle.maxLength}
            error={errors.submitterTitle}
          />
          <Textarea
            label="Question"
            value={values.text}
            onChange={handleFieldChange("text")}
            maxLength={QUESTION_FIELDS.text.maxLength}
            hint={`${values.text.length}/${QUESTION_FIELDS.text.maxLength} characters`}
            error={errors.text}
          />

          {feedback && (
            <div className="inline-actions" role={feedback.kind === "success" ? "status" : "alert"}>
              <Badge variant={feedback.kind === "success" ? "badge4" : "badge6"}>
                {feedback.kind === "success" ? "Submitted" : "Not sent"}
              </Badge>
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="inline-actions">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit question"}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Questions & answers" subtitle="Newest first. Refresh the page to check for new answers.">
        {list.status === "loading" && <p role="status">Loading questions…</p>}

        {list.status === "error" && (
          <div className="inline-actions">
            <span role="alert">{list.message}</span>
            <Button variant="button2" size="sm" onClick={handleRetry}>
              Try again
            </Button>
          </div>
        )}

        {list.status === "ready" &&
          (list.questions.length === 0 ? (
            <p>No questions yet. Ask the first one above.</p>
          ) : (
            <QuestionList questions={list.questions} />
          ))}
      </Card>
    </AppShell>
  );
}
