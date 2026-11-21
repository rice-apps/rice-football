import { updateQuestion } from "@/lib/questions/db";
import { authorizeAccess, Q_AND_A_ANSWER_ACCESS_LEVELS } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";
import { parseQuestionId, validateQuestionUpdate } from "@/lib/questions/validation";

// PATCH updates a question's status and/or answer (used by the analyst page)

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = authorizeAccess(await getCurrentUser(), Q_AND_A_ANSWER_ACCESS_LEVELS);
  if (!authorization.allowed) {
    return Response.json({ error: authorization.message }, { status: authorization.status });
  }

  const id = parseQuestionId((await params).id);
  if (id === null) {
    return Response.json({ error: "Question id must be a valid UUID." }, { status: 400 });
  }

  // Invalid JSON becomes undefined, which the validator rejects.
  const body: unknown = await request.json().catch(() => undefined);
  const result = validateQuestionUpdate(body);
  if (!result.ok) {
    return Response.json({ error: result.error, fieldErrors: result.fieldErrors }, { status: 400 });
  }

  try {
    const question = await updateQuestion(id, result.value);
    if (!question) return Response.json({ error: "Question not found." }, { status: 404 });
    return Response.json({ question });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Couldn't save changes. Please try again." }, { status: 500 });
  }
}
