import assert from "node:assert/strict";
import { test } from "node:test";
import { toReport, toReportInsert, type ReportRow } from "../../src/lib/reports/mapping";
import { cleanTags, parseTags } from "../../src/lib/reports/tags";
import { validateNewReport } from "../../src/lib/reports/validation";

// Fictional metadata only. These checks need no database or credentials.

const validBody = {
  name: "  Red Zone Review  ",
  description: "  Sample description.  ",
  category: "offense",
  kind: "runnable",
  fileType: ".R",
  tags: [" red zone ", "Red Zone", "", "play calling"],
};

test("cleanTags trims, drops blanks, and keeps the first casing of duplicates", () => {
  assert.deepEqual(cleanTags([" Red Zone ", "red zone", "  ", "QB"]), ["Red Zone", "QB"]);
  assert.deepEqual(parseTags("a, A ,,b"), ["a", "b"]);
});

test("validateNewReport returns cleaned metadata with a lowercase extension", () => {
  const result = validateNewReport(validBody);
  assert.deepEqual(result, {
    ok: true,
    value: {
      name: "Red Zone Review",
      description: "Sample description.",
      category: "offense",
      kind: "runnable",
      fileType: ".r",
      tags: ["red zone", "play calling"],
    },
  });
});

test("validateNewReport defaults a missing description and tags", () => {
  const result = validateNewReport({ name: "A", category: "defense", kind: "static", fileType: ".PDF" });
  assert.ok(result.ok);
  assert.equal(result.value.description, "");
  assert.deepEqual(result.value.tags, []);
  assert.equal(result.value.fileType, ".pdf");
});

test("validateNewReport ignores client-supplied id, file URL, and timestamps", () => {
  const result = validateNewReport({ ...validBody, id: "x", fileUrl: "https://example.invalid/a.pdf", createdAt: "2020" });
  assert.ok(result.ok);
  assert.deepEqual(Object.keys(result.value).sort(), ["category", "description", "fileType", "kind", "name", "tags"]);
});

test("validateNewReport rejects non-objects", () => {
  for (const body of [null, "text", 5, []]) {
    const result = validateNewReport(body);
    assert.equal(result.ok, false);
  }
});

function errorsFor(overrides: Record<string, unknown>) {
  const result = validateNewReport({ ...validBody, ...overrides });
  assert.equal(result.ok, false);
  return result.ok ? {} : (result.fieldErrors ?? {});
}

test("validateNewReport reports each invalid field", () => {
  assert.ok(errorsFor({ name: "   " }).name);
  assert.ok(errorsFor({ name: 7 }).name);
  assert.ok(errorsFor({ name: "n".repeat(201) }).name);
  assert.ok(errorsFor({ description: "d".repeat(4001) }).description);
  assert.ok(errorsFor({ category: "coaching" }).category);
  assert.ok(errorsFor({ kind: "script" }).kind);
  assert.ok(errorsFor({ fileType: "" }).fileType);
  assert.ok(errorsFor({ fileType: ".pdf" }).fileType, "a runnable report cannot be a PDF");
  assert.ok(errorsFor({ kind: "static", fileType: ".py" }).fileType);
  assert.ok(errorsFor({ tags: "red zone" }).tags);
  assert.ok(errorsFor({ tags: ["ok", 3] }).tags);
  assert.ok(errorsFor({ tags: Array.from({ length: 9 }, (_, index) => `tag ${index}`) }).tags);
  assert.ok(errorsFor({ tags: ["t".repeat(31)] }).tags);
});

test("validateNewReport accepts values exactly at the limits", () => {
  const result = validateNewReport({
    ...validBody,
    name: "n".repeat(200),
    description: "d".repeat(4000),
    tags: Array.from({ length: 8 }, (_, index) => `${index}`.padEnd(30, "t")),
  });
  assert.ok(result.ok);
});

const row: ReportRow = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Red Zone Review",
  description: "",
  category: "offense",
  kind: "static",
  file_type: ".pdf",
  tags: ["red zone"],
  file_url: null,
  created_at: "2026-11-14T12:00:00+00:00",
  updated_at: "2026-11-14T12:00:00+00:00",
};

test("toReport converts a row and omits a null file URL", () => {
  assert.deepEqual(toReport(row), {
    id: row.id,
    name: "Red Zone Review",
    description: "",
    category: "offense",
    kind: "static",
    fileType: ".pdf",
    tags: ["red zone"],
    createdAt: row.created_at,
  });
  assert.equal(toReport({ ...row, file_url: "/reports/sample.pdf" }).fileUrl, "/reports/sample.pdf");
});

test("toReportInsert never sets a file URL, id, or timestamps", () => {
  const result = validateNewReport(validBody);
  assert.ok(result.ok);
  assert.deepEqual(toReportInsert(result.value), {
    name: "Red Zone Review",
    description: "Sample description.",
    category: "offense",
    kind: "runnable",
    file_type: ".r",
    tags: ["red zone", "play calling"],
    file_url: null,
  });
});
