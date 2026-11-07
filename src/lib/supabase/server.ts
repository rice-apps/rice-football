import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";

// Supabase client that keeps the signed-in user's session in cookies. It uses the publishable
// key, so it can only do what the current session allows. Create a new one for every request.
// proxy.ts and src/lib/auth/session.ts read cookies differently but must share these settings.

// The browser never talks to Supabase (login and logout run on the server), so the session
// cookies can be HttpOnly: page scripts can't read the tokens.
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const;

export function createSupabaseServerClient(cookies: CookieMethodsServer) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required (see .env.example)");
  }

  return createServerClient(url, publishableKey, { cookies, cookieOptions: COOKIE_OPTIONS });
}
