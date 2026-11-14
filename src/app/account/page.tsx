import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { logOut } from "@/lib/auth/actions";
import { ACCESS_LEVEL_LABELS, getCurrentUser } from "@/lib/auth/session";
import styles from "./page.module.css";

// Only a verified session can see this page. The check runs before anything renders, and this
// route has no loading.tsx, so a rejected request gets a real redirect instead of a streamed page.

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const result = await getCurrentUser();
  if (result.status === "signed-out") redirect("/login?reason=signed-out");

  if (result.status === "unavailable") {
    return (
      <AppShell title="Account" subtitle="The account you're logged in with.">
        <Card title="We couldn't check your login">
          <p role="alert">The login service didn&apos;t respond. Refresh the page to try again.</p>
        </Card>
      </AppShell>
    );
  }

  const { user } = result;
  const { logout } = await searchParams;

  return (
    <AppShell title="Account" subtitle="The account you're logged in with.">
      <Card title="Logged in">
        <dl className={styles.details}>
          <dt>Email</dt>
          <dd>{user.email}</dd>
          <dt>Access level</dt>
          <dd>{user.accessLevel ? ACCESS_LEVEL_LABELS[user.accessLevel] : "Not assigned. Ask the project lead."}</dd>
        </dl>

        {logout === "failed" && (
          <div className={`inline-actions ${styles.logoutError}`} role="alert">
            <Badge variant="badge6">Not logged out</Badge>
            <span>We couldn&apos;t reach the login service. Please try again.</span>
          </div>
        )}

        <form action={logOut} className={styles.logout}>
          <Button type="submit" variant="button2">
            Log out
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}
