"use client";

import { useState, type ChangeEvent, type SubmitEvent } from "react";
import Link from "next/link";
import ReportCard from "@/components/reports/ReportCard";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  ALLOWED_EXTENSIONS,
  REPORT_CATEGORIES,
  type Report,
  type ReportCategory,
  type ReportKind,
} from "@/types/report";

const KIND_OPTIONS = [
  { value: "static", label: "Static report (PDF, CSV, HTML)" },
  { value: "runnable", label: "Runnable script (R, Python)" },
];

const MAX_TAGS = 8;
const MAX_TAG_LENGTH = 30;

type FormErrors = {
  name?: string;
  category?: string;
  kind?: string;
  file?: string;
  tags?: string;
};

function fileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex === -1 ? "" : fileName.slice(dotIndex);
}

function isAllowedExtension(kind: ReportKind, extension: string): boolean {
  return ALLOWED_EXTENSIONS[kind].some(
    (allowed) => allowed.toLowerCase() === extension.toLowerCase(),
  );
}

// Trims each comma-separated tag, drops empties, and deduplicates
// case-insensitively, keeping the first occurrence's casing.
function parseTags(input: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of input.split(",")) {
    const tag = raw.trim();
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }
  return tags;
}

export default function ReportUploadForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [category, setCategory] = useState<"" | ReportCategory>("");
  const [kind, setKind] = useState<"" | ReportKind>("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState<Report | null>(null);
  // Bumped on reset to remount the form, clearing the uncontrolled file input.
  const [formKey, setFormKey] = useState(0);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setErrors((previous) => ({ ...previous, file: undefined }));
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const tags = parseTags(tagsInput);

    const nextErrors: FormErrors = {};
    if (!name.trim()) nextErrors.name = "Report name is required.";
    if (!category) nextErrors.category = "Choose a category.";
    if (!kind) nextErrors.kind = "Choose a report kind.";
    if (tags.length > MAX_TAGS) {
      nextErrors.tags = `Use at most ${MAX_TAGS} tags.`;
    } else {
      const tooLong = tags.find((tag) => tag.length > MAX_TAG_LENGTH);
      if (tooLong) {
        nextErrors.tags = `"${tooLong}" is too long — tags can be at most ${MAX_TAG_LENGTH} characters.`;
      }
    }
    if (!file) {
      nextErrors.file = "Choose a file.";
    } else if (kind && !isAllowedExtension(kind, fileExtension(file.name))) {
      const label = kind === "static" ? "Static reports" : "Runnable reports";
      nextErrors.file = `${label} must be one of: ${ALLOWED_EXTENSIONS[kind].join(", ")}`;
    }

    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    // Prototype: only metadata is captured, locally. The file itself is not
    // read, uploaded, or stored anywhere.
    setSubmitted({
      id: `report-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      category: category as ReportCategory,
      kind: kind as ReportKind,
      fileType: fileExtension(file!.name),
      tags,
      createdAt: new Date().toISOString(),
    });
  }

  function resetForm() {
    setName("");
    setDescription("");
    setTagsInput("");
    setCategory("");
    setKind("");
    setFile(null);
    setErrors({});
    setSubmitted(null);
    setFormKey((key) => key + 1);
  }

  if (submitted) {
    return (
      <Card
        title="Report uploaded"
        subtitle="Metadata captured locally — this prototype does not store files, so the report will not persist after a refresh."
      >
        <div className="stacked-form">
          <ReportCard report={submitted} />
          <div className="inline-actions">
            <Button variant="button2" onClick={resetForm}>
              Upload another
            </Button>
            <Link
              href="/analyst/reports"
              className="ui-button ui-button--button1 ui-button--md"
            >
              Back to library
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Report details"
      subtitle="Static reports are finished files; runnable scripts can later be rerun against new data."
    >
      <form
        key={formKey}
        className="stacked-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <Input
          label="Report name"
          placeholder="e.g. Red Zone Efficiency Review"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
        />

        <div className="ui-field">
          <label htmlFor="report-description" className="ui-field__label">
            Description
          </label>
          <textarea
            id="report-description"
            className="ui-input"
            rows={3}
            placeholder="What does this report cover, and for whom?"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <Input
          label="Tags"
          placeholder="e.g. red zone, play calling"
          value={tagsInput}
          onChange={(event) => setTagsInput(event.target.value)}
          hint={`Separate tags with commas. Up to ${MAX_TAGS} tags, ${MAX_TAG_LENGTH} characters each.`}
          error={errors.tags}
        />

        <Select
          label="Category"
          options={REPORT_CATEGORIES}
          placeholder="Choose a category"
          value={category}
          onChange={(event) =>
            setCategory(event.target.value as ReportCategory)
          }
          error={errors.category}
        />

        <Select
          label="Report kind"
          options={KIND_OPTIONS}
          placeholder="Choose static or runnable"
          value={kind}
          onChange={(event) => setKind(event.target.value as ReportKind)}
          error={errors.kind}
          hint={
            kind
              ? `Allowed file types: ${ALLOWED_EXTENSIONS[kind].join(", ")}`
              : undefined
          }
        />

        <Input
          label="File"
          type="file"
          accept={kind ? ALLOWED_EXTENSIONS[kind].join(",") : undefined}
          onChange={handleFileChange}
          error={errors.file}
        />

        <div className="inline-actions">
          <Button type="submit" variant="button1">
            Submit Report
          </Button>
        </div>
      </form>
    </Card>
  );
}
