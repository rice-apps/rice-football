"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import Table from "@/components/ui/Table";
import {
  loadQuestions,
  onQuestionsChangedInOtherTab,
  resetQuestions,
  saveQuestions,
} from "@/lib/questions/storage";
import { isQuestionStatus, QUESTION_STATUSES, type Question, type QuestionStatus } from "@/types/question";
import styles from "./page.module.css";

const STATUS_DISPLAY: Record<QuestionStatus, { label: string; className: string }> = {
  open: { label: "Open", className: styles.statusOpen },
  "in-progress": { label: "In progress", className: styles.statusInProgress },
  answered: { label: "Answered", className: styles.statusAnswered },
};

const STATUS_OPTIONS = QUESTION_STATUSES.map((status) => ({ value: status, label: STATUS_DISPLAY[status].label }));

// undefined = the viewer's own locale and time zone.
const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

function sortNewestFirst(questions: Question[]): Question[] {
  return [...questions].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export default function AnalystQuestionsPage() {
  // Stays null during server rendering so the first browser render matches it (no hydration error).
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after mount.
    setQuestions(loadQuestions());
    // Without this, a status change here would save a stale list over questions submitted in another tab.
    return onQuestionsChangedInOtherTab(() => setQuestions(loadQuestions()));
  }, []);

  function handleStatusChange(questionId: number, status: string) {
    if (!questions || !isQuestionStatus(status)) return;
    const updated = questions.map((question) => (question.id === questionId ? { ...question, status } : question));
    setQuestions(updated);
    setSaveFailed(!saveQuestions(updated));
  }

  function handleReset() {
    if (!window.confirm("Reset to the sample questions? Questions submitted in this browser will be removed.")) return;
    setQuestions(resetQuestions());
    setSaveFailed(false);
  }

  return (
    <AppShell
      title="Staff Questions"
      subtitle="Questions submitted to the analytics team."
      actions={
        <Button variant="button2" size="sm" onClick={handleReset} disabled={questions === null}>
          Reset demo data
        </Button>
      }
    >
      <Card title="Submitted questions" subtitle={questions ? `${questions.length} total · newest first` : undefined}>
        {saveFailed && (
          <div className={`inline-actions ${styles.saveWarning}`} role="alert">
            <Badge variant="badge6">Not saved</Badge>
            <span>This browser is blocking storage, so status changes will be lost when you leave the page.</span>
          </div>
        )}

        {questions === null ? (
          <p>Loading questions…</p>
        ) : (
          <Table
            data={sortNewestFirst(questions)}
            emptyMessage="No questions yet."
            columns={[
              {
                key: "submittedBy",
                header: "Asked by",
                render: (_, question) => (
                  <div className={styles.cellStack}>
                    <strong>{question.submittedBy}</strong>
                    <Badge variant="badge2">{question.submitterTitle}</Badge>
                  </div>
                ),
              },
              {
                key: "text",
                header: "Question",
                render: (_, question) => <span className={styles.questionText}>{question.text}</span>,
              },
              {
                key: "createdAt",
                header: "Submitted",
                render: (_, question) => (
                  <time dateTime={question.createdAt}>{dateFormatter.format(new Date(question.createdAt))}</time>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (_, question) => (
                  <Select
                    aria-label={`Status for question from ${question.submittedBy}`}
                    className={STATUS_DISPLAY[question.status].className}
                    options={STATUS_OPTIONS}
                    value={question.status}
                    onChange={(event) => handleStatusChange(question.id, event.target.value)}
                  />
                ),
              },
            ]}
          />
        )}
      </Card>
    </AppShell>
  );
}
