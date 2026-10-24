"use client";

import { Button } from "@/components/ui/Button";
import { REPORT_CATEGORIES, type ReportCategory } from "@/types/report";

export type CategoryFilter = ReportCategory | "all";

type ReportCategoryTabsProps = {
  selected: CategoryFilter;
  onSelect: (category: CategoryFilter) => void;
};

const TABS: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  ...REPORT_CATEGORIES,
];

export default function ReportCategoryTabs({
  selected,
  onSelect,
}: ReportCategoryTabsProps) {
  return (
    <div className="inline-actions" role="group" aria-label="Filter by category">
      {TABS.map((tab) => (
        <Button
          key={tab.value}
          size="sm"
          variant={selected === tab.value ? "button1" : "button2"}
          aria-pressed={selected === tab.value}
          onClick={() => onSelect(tab.value)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
}
