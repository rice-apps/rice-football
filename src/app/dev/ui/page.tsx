import type { CSSProperties, ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

/*
 * Temporary preview of the shared UI components.
 * Dev-only page: safe to delete or move once the app shell exists.
 */

const pageStyle: CSSProperties = {
  maxWidth: 960,
  margin: "0 auto",
  padding: "var(--space-6) var(--space-4)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-6)",
};

const sectionStyle: CSSProperties = {
  padding: "var(--space-5)",
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
};

const rowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "var(--space-3)",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "var(--space-4)",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={sectionStyle}>
      <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-4)" }}>{title}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>{children}</div>
    </section>
  );
}

const demoOptions = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
  { value: "c", label: "Option C (disabled)", disabled: true },
];

export default function UiPreviewPage() {
  return (
    <main style={pageStyle}>
      <header>
        <Badge variant="badge5">Dev preview</Badge>
        <h1 style={{ fontSize: "var(--text-xl)", marginTop: "var(--space-2)" }}>UI components</h1>
        <p style={{ color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>
          Shared building blocks from <code>src/components/ui</code>. Not a product page.
        </p>
      </header>

      <Section title="Button">
        <div style={rowStyle}>
          <Button variant="button1">button1</Button>
          <Button variant="button2">button2</Button>
          <Button variant="button3">button3</Button>
          <Button variant="button4">button4</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div style={rowStyle}>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
        <Button fullWidth variant="button2">
          Full width
        </Button>
      </Section>

      <Section title="Input">
        <div style={gridStyle}>
          <Input label="Default" placeholder="Type something" />
          <Input label="With hint" placeholder="name@example.com" type="email" hint="We will never share this." />
          <Input label="With error" defaultValue="bad value" error="This field is invalid." />
          <Input label="Disabled" placeholder="Not editable" disabled />
          <Input label="File" type="file" />
          <Input label="Number" type="number" defaultValue={42} />
        </div>
      </Section>

      <Section title="Select">
        <div style={gridStyle}>
          <Select label="With placeholder" placeholder="Choose an option…" options={demoOptions} />
          <Select label="Preselected" defaultValue="b" options={demoOptions} hint="Option B is selected." />
          <Select label="With error" placeholder="Choose an option…" options={demoOptions} error="Selection required." />
          <Select label="Disabled" options={demoOptions} disabled />
        </div>
      </Section>

      <Section title="Badge">
        <div style={rowStyle}>
          <Badge variant="badge1">badge1</Badge>
          <Badge variant="badge2">badge2</Badge>
          <Badge variant="badge3">badge3</Badge>
          <Badge variant="badge4">badge4</Badge>
          <Badge variant="badge5">badge5</Badge>
          <Badge variant="badge6">badge6</Badge>
        </div>
      </Section>
    </main>
  );
}
