import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Keeps Supabase sessions fresh before the auth pages render. Access tokens expire after about an
// hour, and refreshing one issues new single-use tokens that must be saved in cookies. Server
// Components can't write cookies, so without this, people get logged out around the hour mark.
// This doesn't decide who gets in: each page checks with getCurrentUser() (src/lib/auth/session.ts).

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  let supabase;
  try {
    supabase = createSupabaseServerClient({
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        // Give the refreshed session to the page being rendered and to the browser.
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        // Stops CDNs from caching a response that carries someone's session.
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    });
  } catch {
    // Supabase isn't configured; the page will show that it can't check the session.
    return response;
  }

  // Refreshes the session if the access token has expired. Supabase's guidance: don't run other
  // code between creating the client and this call.
  try {
    await supabase.auth.getClaims();
  } catch (error) {
    console.error("Couldn't refresh the session:", error);
  }

  return response;
}

// Only the pages that use the session. Other routes, and the Server Actions on them, skip this.
// A later change that protects more pages must add them here so their sessions stay fresh.
export const config = {
  matcher: ["/login", "/account"],
};
