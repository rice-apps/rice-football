"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { getErrorMessage, patchQuestion, QuestionApiError } from "@/lib/questions/api";
import { QUESTION_FIELDS } from "@/lib/questions/validation";
import type { Question } from "@/types/question";
import styles from "./AnswerEditor.module.css";

type AnswerEditorProps = {
  question: Question;
  onSaved: (question: Question) => void;
  onCancel: () => void;
  /** Called whenever the draft starts or stops differing from the saved answer. */
  onDirtyChange: (dirty: boolean) => void;
};

const { maxLength } = QUESTION_FIELDS.answer;

export default function AnswerEditor({ question, onSaved, onCancel, onDirtyChange }: AnswerEditorProps) {
  const savedAnswer = question.answer ?? "";
  const [draft, setDraft] = useState(savedAnswer);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dirty = draft !== savedAnswer;
  const askedAt = new Date(question.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

  // The analyst just clicked "Answer": focus the box (which also scrolls to it), with the
  // cursor after any saved answer so they can keep writing.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }, []);

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setDraft(event.target.value);
    setError(null);
    onDirtyChange(event.target.value !== savedAnswer);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // A written answer also marks the question answered; clearing the answer leaves the status alone.
      const update = draft.trim() ? { answer: draft, status: "answered" as const } : { answer: draft };
      onSaved(await patchQuestion(question.id, update));
    } catch (caught) {
      const field = caught instanceof QuestionApiError ? caught.fieldErrors.answer : undefined;
      setError({ message: getErrorMessage(caught), field });
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (dirty && !window.confirm("Discard the answer you're writing?")) return;
    onCancel();
  }

  return (
    <Card
      title={`Answer ${question.submittedBy}'s question`}
      subtitle={`${question.submitterTitle} · asked ${askedAt}`}
    >
      <form className="stacked-form" onSubmit={handleSubmit} noValidate>
        <blockquote className={styles.question}>{question.text}</blockquote>

        <Textarea
          ref={textareaRef}
          label="Answer"
          rows={6}
          value={draft}
          onChange={handleChange}
          maxLength={maxLength}
          hint={`${draft.length}/${maxLength} characters · Saving an answer marks the question answered.`}
          error={error?.field}
        />

        {error && (
          <div className="inline-actions" role="alert">
            <Badge variant="badge6">Not saved</Badge>
            <span>{error.message}</span>
          </div>
        )}

        <div className="inline-actions">
          <Button type="submit" disabled={saving || !dirty}>
            {saving ? "Saving…" : "Save answer"}
          </Button>
          <Button variant="button2" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
