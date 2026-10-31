"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import AnswerEditor from "@/components/questions/AnswerEditor";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import Table from "@/components/ui/Table";
import { fetchQuestions, getErrorMessage, patchQuestion } from "@/lib/questions/api";
import {
  isQuestionStatus,
  QUESTION_STATUS_LABELS,
  QUESTION_STATUSES,
  type Question,
  type QuestionStatus,
} from "@/types/question";
import styles from "./page.module.css";

const STATUS_CLASSES: Record<QuestionStatus, string> = {
  open: styles.statusOpen,
  "in-progress": styles.statusInProgress,
  answered: styles.statusAnswered,
};

const STATUS_OPTIONS = QUESTION_STATUSES.map((status) => ({ value: status, label: QUESTION_STATUS_LABELS[status] }));

type ListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; questions: Question[] };

// Feedback for a status change made from the table, per question.
type StatusSave = { state: "saving"; status: QuestionStatus } | { state: "saved" } | { state: "error"; message: string };

export default function AnalystQuestionsPage() {
  const [list, setList] = useState<ListState>({ status: "loading" });
  const [statusSaves, setStatusSaves] = useState<Record<number, StatusSave>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editorDirty, setEditorDirty] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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

  function replaceQuestion(updated: Question) {
    setList((current) =>
      current.status === "ready"
        ? { status: "ready", questions: current.questions.map((q) => (q.id === updated.id ? updated : q)) }
        : current,
    );
  }

  function setStatusSave(id: number, save: StatusSave) {
    setStatusSaves((current) => ({ ...current, [id]: save }));
  }

  // Hides "Saved" after a moment, unless the status has been changed again since.
  function clearSavedNote(id: number) {
    setStatusSaves((current) => {
      if (current[id]?.state !== "saved") return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  async function handleStatusChange(question: Question, value: string) {
    if (!isQuestionStatus(value) || value === question.status) return;
    setNotice(null);
    setStatusSave(question.id, { state: "saving", status: value });
    try {
      replaceQuestion(await patchQuestion(question.id, { status: value }));
      setStatusSave(question.id, { state: "saved" });
      setTimeout(() => clearSavedNote(question.id), 2500);
    } catch (error) {
      setStatusSave(question.id, { state: "error", message: getErrorMessage(error) });
    }
  }

  function openEditor(id: number) {
    if (editingId !== null && editorDirty && !window.confirm("Discard the answer you're writing?")) return;
    setEditingId(id);
    setEditorDirty(false);
    setNotice(null);
  }

  function closeEditor() {
    setEditingId(null);
    setEditorDirty(false);
  }

  function handleAnswerSaved(updated: Question) {
    replaceQuestion(updated);
    closeEditor();
    setNotice(`Saved the answer to ${updated.submittedBy}'s question.`);
  }

  const questions = list.status === "ready" ? list.questions : [];
  const editingQuestion = questions.find((question) => question.id === editingId);

  return (
    <AppShell title="Staff Questions" subtitle="Questions submitted to the analytics team.">
      {editingQuestion && (
        <AnswerEditor
          key={editingQuestion.id}
          question={editingQuestion}
          onSaved={handleAnswerSaved}
          onCancel={closeEditor}
          onDirtyChange={setEditorDirty}
        />
      )}

      <Card
        title="Submitted questions"
        subtitle={
          list.status === "ready"
            ? `${questions.length} total · newest first · refresh the page to check for new questions`
            : undefined
        }
      >
        {notice && (
          <div className={`inline-actions ${styles.notice}`} role="status">
            <Badge variant="badge4">Saved</Badge>
            <span>{notice}</span>
          </div>
        )}

        {list.status === "loading" && <p role="status">Loading questions…</p>}

        {list.status === "error" && (
          <div className="inline-actions">
            <span role="alert">{list.message}</span>
            <Button variant="button2" size="sm" onClick={handleRetry}>
              Try again
            </Button>
          </div>
        )}

        {list.status === "ready" && (
          <Table
            data={questions}
            emptyMessage="No questions yet."
            columns={[
              {
                key: "submittedBy",
                header: "Asked by",
                render: (_, question) => (
                  <div className={`${styles.cellStack} ${styles.askedBy}`}>
                    <strong>{question.submittedBy}</strong>
                    <Badge variant="badge2" className={styles.titleBadge}>
                      {question.submitterTitle}
                    </Badge>
                  </div>
                ),
              },
              {
                key: "text",
                header: "Question",
                render: (_, question) => <span className={styles.longText}>{question.text}</span>,
              },
              {
                key: "createdAt",
                header: "Submitted",
                render: (_, question) => (
                  <time dateTime={question.createdAt}>
                    {new Date(question.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </time>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (_, question) => {
                  const save = statusSaves[question.id];
                  const status = save?.state === "saving" ? save.status : question.status;
                  return (
                    <div className={styles.cellStack}>
                      <Select
                        aria-label={`Status for question from ${question.submittedBy}`}
                        className={`${styles.statusSelect} ${STATUS_CLASSES[status]}`}
                        options={STATUS_OPTIONS}
                        value={status}
                        disabled={save?.state === "saving"}
                        onChange={(event) => handleStatusChange(question, event.target.value)}
                      />
                      {save?.state === "saving" && <span className={styles.saveNote}>Saving…</span>}
                      {save?.state === "saved" && (
                        <span className={styles.saveNote} role="status">
                          Saved
                        </span>
                      )}
                      {save?.state === "error" && (
                        <span className={styles.saveError} role="alert">
                          {save.message}
                        </span>
                      )}
                    </div>
                  );
                },
              },
              {
                key: "answer",
                header: "Answer",
                render: (_, question) => {
                  const isEditing = question.id === editingId;
                  return (
                    <div className={styles.cellStack}>
                      {question.answer ? (
                        <span className={`${styles.longText} ${styles.answerPreview}`}>{question.answer}</span>
                      ) : (
                        <span className={styles.noAnswer}>No answer yet</span>
                      )}
                      <Button
                        variant="button2"
                        size="sm"
                        disabled={isEditing}
                        onClick={() => openEditor(question.id)}
                        aria-label={`${question.answer ? "Edit answer to" : "Answer"} ${question.submittedBy}'s question`}
                      >
                        {isEditing ? "Editing" : question.answer ? "Edit answer" : "Answer"}
                      </Button>
                    </div>
                  );
                },
              },
            ]}
          />
        )}
      </Card>
    </AppShell>
  );
}
