import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { getCurrentUser } from "@/lib/auth/session";
import LoginForm from "./LoginForm";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  // Same check as /account, so the two pages always agree on who's logged in.
  const current = await getCurrentUser();

  // Deliberately not redirect("/account"). When a page redirects, Next.js re-sends the cookies
  // proxy.ts set, and in testing it dropped their Max-Age. After a token refresh, that could turn
  // the login into a cookie that's lost when the browser closes.
  if (current.status === "signed-in") {
    return (
      <AppShell title="Log in" subtitle="Use the shared account for your role.">
        <Card title="You're already logged in">
          <div className="inline-actions">
            <span>Logged in as {current.user.email}.</span>
            <Link href="/account" className="ui-button ui-button--button1 ui-button--md">
              Go to your account
            </Link>
          </div>
        </Card>
      </AppShell>
    );
  }

  const { reason } = await searchParams;

  return (
    <AppShell title="Log in" subtitle="Use the shared account for your role.">
      <Card title="Log in">
        <div className="stacked-form">
          {reason === "signed-out" && (
            <div className="inline-actions" role="status">
              <Badge variant="badge5">Login required</Badge>
              <span>Please log in to continue. If you were already logged in, your session has ended.</span>
            </div>
          )}
          {reason === "logged-out" && (
            <div className="inline-actions" role="status">
              <Badge variant="badge4">Logged out</Badge>
              <span>You&apos;ve logged out.</span>
            </div>
          )}

          <LoginForm />
        </div>
      </Card>
    </AppShell>
  );
}
