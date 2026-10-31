import { createQuestion, listQuestions } from "@/lib/questions/db";
import { validateNewQuestion } from "@/lib/questions/validation";

// GET lists every question (newest first); POST submits a new one.
// No authentication yet: anyone who can reach the app can call these (development demo).

export async function GET() {
  try {
    return Response.json({ questions: await listQuestions() });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Couldn't load questions. Please try again." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Invalid JSON becomes undefined, which the validator rejects.
  const body: unknown = await request.json().catch(() => undefined);
  const result = validateNewQuestion(body);
  if (!result.ok) {
    return Response.json({ error: result.error, fieldErrors: result.fieldErrors }, { status: 400 });
  }

  try {
    return Response.json({ question: await createQuestion(result.value) }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Couldn't save your question. Please try again." }, { status: 500 });
  }
}
