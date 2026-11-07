"use server";

import { isAuthRetryableFetchError, type AuthError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/auth/session";

export type LogInState = {
  error: string | null;
  /** Kept so the form can refill it after a failed attempt. The password is never sent back. */
  email: string;
};

export async function logIn(_previous: LogInState, formData: FormData): Promise<LogInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password.", email };

  let error: AuthError | null;
  try {
    const supabase = await createSessionClient();
    ({ error } = await supabase.auth.signInWithPassword({ email, password }));
  } catch (caught) {
    console.error("Login failed:", caught);
    return { error: "We couldn't reach the login service. Please try again.", email };
  }

  if (error) return { error: logInErrorMessage(error), email };

  // Always the same page, so there's no redirect target for anyone to tamper with.
  redirect("/account");
}

export async function logOut() {
  const supabase = await createSessionClient();
  // "local" ends only this browser's session. Supabase's default ("global") would log out
  // everyone using this shared account, on every device.
  const { error } = await supabase.auth.signOut({ scope: "local" });

  // On failure Supabase keeps the session cookies, so don't act as if the user is logged out.
  if (error) {
    console.error("Logout failed:", error.code ?? error.message);
    redirect("/account?logout=failed");
  }

  redirect("/login?reason=logged-out");
}

// Supabase recommends checking error codes rather than messages. Wrong email and wrong password
// get the same message, so the form doesn't reveal which accounts exist.
function logInErrorMessage(error: AuthError): string {
  if (isAuthRetryableFetchError(error)) return "We couldn't reach the login service. Please try again.";

  switch (error.code) {
    case "invalid_credentials":
      return "Incorrect email or password.";
    case "over_request_rate_limit":
      return "Too many login attempts. Wait a few minutes and try again.";
    case "email_not_confirmed":
    case "user_banned":
      return "This account can't log in right now. Ask the project lead.";
    default:
      console.error("Login failed:", error.code ?? error.message);
      return "We couldn't log you in. Please try again.";
  }
}
