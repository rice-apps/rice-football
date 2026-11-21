import type { AccessLevel, CurrentUser, CurrentUserResult } from "@/lib/auth/session";

/** Access levels allowed to read or submit Staff Q&A questions. */
export const Q_AND_A_READ_ACCESS_LEVELS = [
  "coach",
  "front_office",
  "analyst_full",
  "analyst_limited",
] as const satisfies readonly AccessLevel[];

/** Access levels allowed to answer questions or change their status. */
export const Q_AND_A_ANSWER_ACCESS_LEVELS = [
  "analyst_full",
  "analyst_limited",
] as const satisfies readonly AccessLevel[];

export type AuthorizationDecision =
  | { allowed: true; user: CurrentUser }
  | { allowed: false; status: 401 | 403 | 503; message: string };

/**
 * Evaluates permissions for a result from getCurrentUser(). Callers must verify the session for
 * each protected request; this function only classifies that verified result and an allowlist.
 */
export function authorizeAccess(
  current: CurrentUserResult,
  allowedAccessLevels: readonly AccessLevel[],
): AuthorizationDecision {
  if (current.status === "signed-out") {
    return { allowed: false, status: 401, message: "Log in to use Staff Q&A." };
  }

  if (current.status === "unavailable") {
    return { allowed: false, status: 503, message: "We couldn't verify your account. Please try again." };
  }

  if (current.user.accessLevel === null || !allowedAccessLevels.includes(current.user.accessLevel)) {
    return { allowed: false, status: 403, message: "Your account isn't allowed to do that." };
  }

  return { allowed: true, user: current.user };
}