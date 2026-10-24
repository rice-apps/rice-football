"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import AppShell from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { loadQuestions, saveQuestions } from "@/lib/questions/storage";
import type { Question } from "@/types/question";
import styles from "./page.module.css";

// Name and title are typed manually for now; they will come from auth later.

const FIELDS = {
  submittedBy: { label: "Your name", maxLength: 80 },
  submitterTitle: { label: "Role / title", maxLength: 80 },
  text: { label: "Question", maxLength: 1000 },
};

type FieldName = keyof typeof FIELDS;
type FormValues = Record<FieldName, string>;
type FormErrors = Partial<Record<FieldName, string>>;
type Feedback = { kind: "success" | "error"; message: string } | null;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  for (const field of Object.keys(FIELDS) as FieldName[]) {
    const { label, maxLength } = FIELDS[field];
    const value = values[field].trim();
    if (value === "") {
      errors[field] = `${label} is required.`;
    } else if (value.length > maxLength) {
      errors[field] = `${label} must be ${maxLength} characters or fewer.`;
    }
  }
  return errors;
}

// crypto.randomUUID only exists on HTTPS or localhost, e.g. not when demoing over a LAN IP.
function createQuestionId(): string {
  return `question-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}

export default function AskQuestionPage() {
  const [values, setValues] = useState<FormValues>({ submittedBy: "", submitterTitle: "", text: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [feedback, setFeedback] = useState<Feedback>(null);

  function handleFieldChange(field: FieldName) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
      setFeedback(null);
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setFeedback(null);
    if (Object.keys(nextErrors).length > 0) return;

    const question: Question = {
      id: createQuestionId(),
      submittedBy: values.submittedBy.trim(),
      submitterTitle: values.submitterTitle.trim(),
      text: values.text.trim(),
      status: "open",
      createdAt: new Date().toISOString(),
    };

    if (!saveQuestions([question, ...loadQuestions()])) {
      setFeedback({ kind: "error", message: "Your question couldn't be saved because this browser is blocking storage." });
      return;
    }

    setFeedback({ kind: "success", message: "Thanks! Your question was sent to the analytics team." });
    // Keep name and title so the same person can ask a follow-up quickly.
    setValues((current) => ({ ...current, text: "" }));
  }

  return (
    <AppShell title="Ask the Analytics Team" subtitle="Send a question to Rice Football's analysts.">
      <Card title="New question" subtitle="All fields are required.">
        <form className="stacked-form" onSubmit={handleSubmit} noValidate>
          <Input
            label={FIELDS.submittedBy.label}
            autoComplete="name"
            value={values.submittedBy}
            onChange={handleFieldChange("submittedBy")}
            maxLength={FIELDS.submittedBy.maxLength}
            error={errors.submittedBy}
          />
          <Input
            label={FIELDS.submitterTitle.label}
            placeholder="e.g. Offensive Coordinator"
            value={values.submitterTitle}
            onChange={handleFieldChange("submitterTitle")}
            maxLength={FIELDS.submitterTitle.maxLength}
            error={errors.submitterTitle}
          />

          {/* No shared Textarea component yet, so this mirrors Input's markup. */}
          <div className="ui-field">
            <label htmlFor="question-text" className="ui-field__label">
              {FIELDS.text.label}
            </label>
            <textarea
              id="question-text"
              rows={5}
              className={`ui-input ${styles.questionInput}`}
              value={values.text}
              onChange={handleFieldChange("text")}
              maxLength={FIELDS.text.maxLength}
              aria-invalid={errors.text ? true : undefined}
              aria-describedby={errors.text ? "question-text-hint question-text-error" : "question-text-hint"}
            />
            <p id="question-text-hint" className="ui-field__hint">
              {values.text.length}/{FIELDS.text.maxLength} characters
            </p>
            {errors.text && (
              <p id="question-text-error" className="ui-field__error" role="alert">
                {errors.text}
              </p>
            )}
          </div>

          {feedback && (
            <div className="inline-actions" role={feedback.kind === "success" ? "status" : "alert"}>
              <Badge variant={feedback.kind === "success" ? "badge4" : "badge6"}>
                {feedback.kind === "success" ? "Submitted" : "Not saved"}
              </Badge>
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="inline-actions">
            <Button type="submit">Submit question</Button>
          </div>
        </form>
      </Card>
    </AppShell>
  );
}
