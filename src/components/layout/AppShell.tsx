import type { ReactNode } from "react";
import Header from "./Header";
import PageContainer from "./PageContainer";
import Sidebar from "./Sidebar";

type AppShellProps = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function AppShell({
  eyebrow,
  title = "Overview",
  subtitle = "A reusable foundation for future product pages.",
  actions,
  children,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <Header />

      <div className="app-shell__body">
        <Sidebar />

        <main className="app-shell__main">
          <PageContainer eyebrow={eyebrow} title={title} subtitle={subtitle} actions={actions}>
            {children}
          </PageContainer>
        </main>
      </div>
    </div>
  );
}
