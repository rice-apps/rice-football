import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import { authorizeAccess, Q_AND_A_ANSWER_ACCESS_LEVELS } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AnalystQuestionsLayout({ children }: { children: ReactNode }) {
  const authorization = authorizeAccess(await getCurrentUser(), Q_AND_A_ANSWER_ACCESS_LEVELS);

  if (!authorization.allowed) {
    if (authorization.status === 401) redirect("/login?reason=signed-out");

    return (
      <AppShell title="Staff Questions" subtitle="Questions submitted to the analytics team.">
        <Card title={authorization.status === 503 ? "We couldn't check your access" : "Access restricted"}>
          <p role="alert">{authorization.message}</p>
        </Card>
      </AppShell>
    );
  }

  return children;
}
