// Mock development type for the analyst report library prototype.
export type ReportCategory =
  | "offense"
  | "defense"
  | "special-teams"
  | "player-personnel";

export type ReportKind = "static" | "runnable";

export type Report = {
  id: string;
  name: string;
  description: string;
  category: ReportCategory;
  kind: ReportKind;
  fileType: string; // extension, e.g. ".pdf", ".R"
  createdAt: string; // ISO date string
};

// Display labels for tabs and form selects, in client-confirmed order.
export const REPORT_CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: "offense", label: "Offense" },
  { value: "defense", label: "Defense" },
  { value: "special-teams", label: "Special Teams" },
  { value: "player-personnel", label: "Player Personnel" },
];

// Allowed file extensions per report kind, used for upload validation.
export const ALLOWED_EXTENSIONS: Record<ReportKind, string[]> = {
  static: [".pdf", ".csv", ".html"],
  runnable: [".R", ".py"],
};
