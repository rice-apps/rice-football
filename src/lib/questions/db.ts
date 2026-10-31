import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { NewQuestion, QuestionUpdate } from "@/lib/questions/validation";
import type { Question, QuestionStatus } from "@/types/question";

// Reads and writes the Supabase `questions` table. This must only run on the server: it uses the secret key,
// which bypasses Row Level Security. The table has RLS on with no policies, so the publishable key can't read or write it.

type QuestionRow = {
  id: number;
  submitter_name: string;
  submitter_title: string;
  question: string;
  answer: string | null;
  status: QuestionStatus;
  created_at: string;
  updated_at: string;
};

const COLUMNS = "id, submitter_name, submitter_title, question, answer, status, created_at, updated_at";

let supabase: SupabaseClient | undefined;

// Created on first use
function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    if (!url || !secretKey) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required (see .env.example)");
    }
    // The server has no user sessions to store or refresh.
    supabase = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return supabase;
}

/** All questions, newest first. */
export async function listQuestions(): Promise<Question[]> {
  const { data, error } = await getSupabase()
    .from("questions")
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .overrideTypes<QuestionRow[], { merge: false }>();

  if (error) throw new Error(`Failed to list questions: ${error.message}`);
  return data.map(toQuestion);
}

/** Saves a new question. New questions always start open with no answer. */
export async function createQuestion(question: NewQuestion): Promise<Question> {
  const { data, error } = await getSupabase()
    .from("questions")
    .insert({
      submitter_name: question.submittedBy,
      submitter_title: question.submitterTitle,
      question: question.text,
      status: "open",
    })
    .select(COLUMNS)
    .single()
    .overrideTypes<QuestionRow, { merge: false }>();

  if (error) throw new Error(`Failed to create question: ${error.message}`);
  return toQuestion(data);
}

/** Updates a question's status and/or answer. Returns null if no question has this id. */
export async function updateQuestion(id: number, update: QuestionUpdate): Promise<Question | null> {
  const { data, error } = await getSupabase()
    .from("questions")
    // Undefined fields are left out of the request, so only the provided fields change.
    .update({ status: update.status, answer: update.answer, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(COLUMNS)
    .maybeSingle()
    .overrideTypes<QuestionRow, { merge: false }>();

  if (error) throw new Error(`Failed to update question ${id}: ${error.message}`);
  return data ? toQuestion(data) : null;
}

/* Convert to backend type */
function toQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    submittedBy: row.submitter_name,
    submitterTitle: row.submitter_title,
    text: row.question,
    status: row.status,
    answer: row.answer,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
