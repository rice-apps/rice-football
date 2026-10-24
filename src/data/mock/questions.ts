import type { Question } from "@/types/question";

// Sample questions for the Staff Q&A demo. Names are fictional.
export const mockQuestions: Question[] = [
  {
    id: "question-1",
    submittedBy: "Jordan Ellis",
    submitterTitle: "General Manager",
    text: "Which transfer portal running backs fit our scheme best based on yards after contact?",
    status: "open",
    createdAt: "2026-10-22T15:10:00.000Z",
  },
  {
    id: "question-2",
    submittedBy: "Marcus Reed",
    submitterTitle: "Offensive Coordinator",
    text: "How does our third-down conversion rate compare when we line up in 11 personnel versus 12 personnel?",
    status: "in-progress",
    createdAt: "2026-10-21T19:45:00.000Z",
  },
  {
    id: "question-3",
    submittedBy: "Dana Whitfield",
    submitterTitle: "Defensive Line Coach",
    text: "Can we get pressure rates by defensive lineman for the last four games?",
    status: "answered",
    createdAt: "2026-10-19T13:20:00.000Z",
  },
  {
    id: "question-4",
    submittedBy: "Sam Ortega",
    submitterTitle: "Director of Football Operations",
    text: "Is there a summary of opponent tendencies on 4th down we can share with the staff before Saturday?",
    status: "open",
    createdAt: "2026-10-23T16:05:00.000Z",
  },
  {
    id: "question-5",
    submittedBy: "Jordan Ellis",
    submitterTitle: "General Manager",
    text: "What were our special teams starting field position averages this season?",
    status: "answered",
    createdAt: "2026-10-15T21:30:00.000Z",
  },
];
