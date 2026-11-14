import "server-only";
import { isAuthApiError, isAuthSessionMissingError, type AuthError, type User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Decides who is logged in. Every page or action that depends on the user must call
// getCurrentUser() itself; nothing else (proxy.ts, layouts, hidden links) protects a page.

// Set per account by the lead in Supabase (app_metadata.access_level). Users can't change
// app_metadata, unlike user_metadata. These are labels only: no permissions are attached yet.
export const ACCESS_LEVELS = ["coach", "front_office", "analyst_full", "analyst_limited"] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  coach: "Coach",
  front_office: "Front office",
  analyst_full: "Analyst (full access)",
  analyst_limited: "Analyst (limited access)",
};

export type CurrentUser = {
  id: string;
  email: string;
  /** null if the account has no level, or one this code doesn't recognize. */
  accessLevel: AccessLevel | null;
};

export type CurrentUserResult =
  | { status: "signed-in"; user: CurrentUser }
  | { status: "signed-out" }
  // Supabase couldn't be reached, so we don't know. Show nothing private, but don't log the user out.
  | { status: "unavailable" };

/** Supabase client for this request's session cookies, for Server Components and Server Actions. */
export async function createSessionClient() {
  return sessionClient(await cookies());
}

function sessionClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createSupabaseServerClient({
    getAll: () => cookieStore.getAll(),
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      } catch {
        // Server Components can't write cookies. proxy.ts saves refreshed sessions instead.
      }
    },
  });
}

/**
 * The verified user for this request, checked once per render.
 *
 * Uses getUser(), which asks Supabase Auth, rather than getClaims(). With this project's signing
 * keys, getClaims() only checks the token locally, so a session ended by a password change (the
 * only way to remove someone from a shared account) or a changed access level wouldn't take
 * effect until the token expired, up to an hour later. Never use getSession() on the server: it
 * doesn't verify anything.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUserResult> => {
  // Outside the try/catch: Next.js marks a page as dynamic by throwing from cookies(), and that
  // signal must reach Next.js instead of being treated as a failed check.
  const cookieStore = await cookies();

  let error: AuthError | null;
  let user: User | null;
  try {
    ({ data: { user }, error } = await sessionClient(cookieStore).auth.getUser());
  } catch (caught) {
    console.error("Couldn't verify the session:", caught);
    return { status: "unavailable" };
  }

  if (user) return { status: "signed-in", user: toCurrentUser(user) };

  // No session, or one Supabase rejected (expired, revoked, or tampered with). Supabase reports a
  // revoked session the same way as no session, so the two can't be told apart.
  if (!error || isAuthSessionMissingError(error) || (isAuthApiError(error) && error.status < 500)) {
    return { status: "signed-out" };
  }

  console.error("Couldn't verify the session:", error.code ?? error.message);
  return { status: "unavailable" };
});

function toCurrentUser(user: User): CurrentUser {
  const accessLevel: unknown = user.app_metadata.access_level;
  return {
    id: user.id,
    email: user.email ?? "",
    accessLevel: ACCESS_LEVELS.includes(accessLevel as AccessLevel) ? (accessLevel as AccessLevel) : null,
  };
}
