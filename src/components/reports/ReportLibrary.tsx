"use client";

import { useCallback, useEffect, useState } from "react";
import ReportCard from "@/components/reports/ReportCard";
import ReportCategoryTabs, {
  type CategoryFilter,
} from "@/components/reports/ReportCategoryTabs";
import { matchesReportQuery } from "@/components/reports/searchReports";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  fetchAnalystReports,
  fetchStaffReports,
  getErrorMessage,
  type ReportListResponse,
} from "@/lib/reports/api";

type ReportLibraryProps = {
  /**
   * Which stored reports to load. "staff" uses the endpoint that returns
   * static reports only; the server applies that filter, not this component.
   */
  audience: "staff" | "analyst";
};

type ListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | ({ status: "ready" } & ReportListResponse);

const EMPTY_MESSAGES: Record<ReportLibraryProps["audience"], string> = {
  staff: "No reports have been shared yet.",
  analyst: "No reports have been saved yet. Use Upload Report to add one.",
};

// Loads stored report metadata and filters it by category and keyword.
export default function ReportLibrary({ audience }: ReportLibraryProps) {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [list, setList] = useState<ListState>({ status: "loading" });

  const loadReports = useCallback(() => {
    const fetchReports =
      audience === "staff" ? fetchStaffReports : fetchAnalystReports;
    fetchReports().then(
      (response) => setList({ status: "ready", ...response }),
      (error: unknown) =>
        setList({ status: "error", message: getErrorMessage(error) }),
    );
  }, [audience]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  function handleRetry() {
    setList({ status: "loading" });
    loadReports();
  }

  function resetFilters() {
    setQuery("");
    setCategory("all");
  }

  if (list.status === "loading") {
    return <p role="status">Loading reports…</p>;
  }

  if (list.status === "error") {
    return (
      <div className="inline-actions">
        <span role="alert">{list.message}</span>
        <Button variant="button2" size="sm" onClick={handleRetry}>
          Try again
        </Button>
      </div>
    );
  }

  // Nothing is stored at all, as opposed to nothing matching the filters.
  if (list.reports.length === 0) {
    return <p role="status">{EMPTY_MESSAGES[audience]}</p>;
  }

  const visibleReports = list.reports.filter(
    (report) =>
      (category === "all" || report.category === category) &&
      matchesReportQuery(report, query),
  );
  const trimmedQuery = query.trim();
  const hasActiveFilters = trimmedQuery !== "" || category !== "all";

  return (
    <>
      <ReportCategoryTabs selected={category} onSelect={setCategory} />

      <Input
        type="search"
        label="Search reports"
        placeholder="Search by name, description, or tag"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {list.truncated && (
        <p className="ui-field__hint" role="status">
          Showing the {list.limit} newest reports. Older reports are not
          listed, and search only covers the reports shown.
        </p>
      )}

      {hasActiveFilters && (
        <div className="inline-actions">
          <Button variant="button2" size="sm" onClick={resetFilters}>
            Clear search and filters
          </Button>
        </div>
      )}

      {visibleReports.length > 0 ? (
        <div className="page-grid">
          {visibleReports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      ) : (
        <p className="ui-field__hint" role="status">
          {trimmedQuery
            ? category === "all"
              ? `No reports match "${trimmedQuery}".`
              : `No reports match "${trimmedQuery}" in this category.`
            : "No reports in this category yet."}
        </p>
      )}
    </>
  );
}
