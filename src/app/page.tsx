import AppShell from "../components/layout/AppShell";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import Card from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import Table from "../components/ui/Table";

const statCards = [
  { label: "Active views", value: "12", tone: "badge2" as const },
  { label: "Components", value: "18", tone: "badge4" as const },
  { label: "Data sources", value: "03", tone: "badge3" as const },
];

const sampleRows = [
  { id: 1, name: "Layout shell", owner: "Platform", status: "Ready", updated: "2h ago" },
  { id: 2, name: "Shared actions", owner: "UI", status: "Ready", updated: "4h ago" },
  { id: 3, name: "Data preview", owner: "Frontend", status: "Draft", updated: "1d ago" },
  { id: 4, name: "Upload prototype", owner: "Tools", status: "Queued", updated: "2d ago" },
];

export default function Home() {
  return (
    <AppShell
      title="Application shell"
      subtitle="A reusable foundation for future product pages and internal tooling."
      actions={
        <>
          <Button variant="button2" size="sm">
            Preview
          </Button>
          <Button variant="button1" size="sm">
            New item
          </Button>
        </>
      }
    >
      <div className="page-grid">
        {statCards.map((card) => (
          <Card key={card.label} className="stat-card">
            <div className="stat-card__label">{card.label}</div>
            <div className="stat-card__value-wrap">
              <div className="stat-card__value">{card.value}</div>
              <Badge variant={card.tone}>Live</Badge>
            </div>
          </Card>
        ))}
      </div>

      <div className="content-grid">
        <Card title="Quick actions" actions={<Badge variant="badge3">Sandbox</Badge>}>
          <div className="stacked-form">
            <Input label="Search" placeholder="Find a component or page" />
            <Select
              label="Workspace"
              options={[
                { value: "overview", label: "Overview" },
                { value: "templates", label: "Templates" },
                { value: "components", label: "Components" },
              ]}
              placeholder="Choose a workspace"
              defaultValue="overview"
            />
            <div className="inline-actions">
              <Button variant="button2">Save draft</Button>
              <Button variant="button1">Publish</Button>
            </div>
          </div>
        </Card>

        <Card title="Recent activity" actions={<Badge variant="badge1">Updated</Badge>}>
          <ul className="activity-list">
            <li>
              <span className="activity-list__bullet" />
              Shared navigation and page structure are in place.
            </li>
            <li>
              <span className="activity-list__bullet" />
              Reusable UI foundations are ready to compose into future pages.
            </li>
            <li>
              <span className="activity-list__bullet" />
              Styling remains generic and intentionally not tied to a final feature.
            </li>
          </ul>
        </Card>
      </div>

      <Card title="Sample data table" actions={<Badge variant="badge4">Ready</Badge>}>
        <Table
          columns={[
            { key: "name", header: "Name" },
            { key: "owner", header: "Owner" },
            {
              key: "status",
              header: "Status",
              render: (value) => {
                const tone =
                  value === "Ready" ? "badge4" : value === "Draft" ? "badge5" : "badge1";

                return <Badge variant={tone}>{String(value)}</Badge>;
              },
            },
            { key: "updated", header: "Updated" },
          ]}
          data={sampleRows}
          getRowKey={(row) => row.id.toString()}
        />
      </Card>
    </AppShell>
  );
}
