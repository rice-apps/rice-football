import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { QUESTION_STATUS_LABELS, type Question, type QuestionStatus } from "@/types/question";
import styles from "./QuestionList.module.css";

// Read-only list of questions and their answers, for the staff page.

const STATUS_BADGES: Record<QuestionStatus, BadgeVariant> = {
  open: "badge5",
  "in-progress": "badge3",
  answered: "badge4",
};

type QuestionListProps = {
  questions: Question[];
};

export default function QuestionList({ questions }: QuestionListProps) {
  return (
    <ul className={styles.list}>
      {questions.map((question) => (
        <li key={question.id} className={styles.item}>
          <div className={styles.header}>
            <Badge variant={STATUS_BADGES[question.status]}>{QUESTION_STATUS_LABELS[question.status]}</Badge>
            <time className={styles.time} dateTime={question.createdAt}>
              {new Date(question.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
            </time>
          </div>

          <p className={styles.question}>{question.text}</p>
          <p className={styles.askedBy}>
            {question.submittedBy} · {question.submitterTitle}
          </p>

          {question.answer ? (
            <div className={styles.answer}>
              <p className={styles.answerLabel}>Answer from the analytics team</p>
              <p className={styles.answerText}>{question.answer}</p>
            </div>
          ) : (
            <p className={styles.noAnswer}>
              {question.status === "answered" ? "Marked answered without a written reply." : "Waiting for an answer."}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
