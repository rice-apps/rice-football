"use client";

import { useState, type ChangeEvent, type SubmitEvent } from "react";
import Link from "next/link";
import ReportCard from "@/components/reports/ReportCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  ReportApiError,
  getErrorMessage,
  submitReport,
} from "@/lib/reports/api";
import {
  MAX_TAG_LENGTH,
  MAX_TAGS,
  getTagsError,
  parseTags,
} from "@/lib/reports/tags";
import {
  REPORT_FIELDS,
  fileExtension,
  isAllowedExtension,
  normalizeExtension,
  type ReportFieldErrors,
} from "@/lib/reports/validation";
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

type FormErrors = {
  name?: string;
  description?: string;
  category?: string;
  kind?: string;
  file?: string;
  tags?: string;
};

// Field errors returned by the API, placed on the matching form fields.
function toFormErrors(fieldErrors: ReportFieldErrors): FormErrors {
  return {
    name: fieldErrors.name,
    description: fieldErrors.description,
    category: fieldErrors.category,
    kind: fieldErrors.kind,
    file: fieldErrors.fileType,
    tags: fieldErrors.tags,
  };
}

export default function ReportUploadForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [category, setCategory] = useState<"" | ReportCategory>("");
  const [kind, setKind] = useState<"" | ReportKind>("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // The record as saved by the database, shown after a successful submit.
  const [submitted, setSubmitted] = useState<Report | null>(null);
  // Bumped on reset to remount the form, clearing the uncontrolled file input.
  const [formKey, setFormKey] = useState(0);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setErrors((previous) => ({ ...previous, file: undefined }));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaveError(null);

    const tags = parseTags(tagsInput);

    const nextErrors: FormErrors = {};
    if (!name.trim()) {
      nextErrors.name = "Report name is required.";
    } else if (name.trim().length > REPORT_FIELDS.name.maxLength) {
      nextErrors.name = `Report name must be ${REPORT_FIELDS.name.maxLength} characters or fewer.`;
    }
    if (description.trim().length > REPORT_FIELDS.description.maxLength) {
      nextErrors.description = `Description must be ${REPORT_FIELDS.description.maxLength} characters or fewer.`;
    }
    if (!category) nextErrors.category = "Choose a category.";
    if (!kind) nextErrors.kind = "Choose a report kind.";
    nextErrors.tags = getTagsError(tags);
    if (!file) {
      nextErrors.file = "Choose a file.";
    } else if (kind && !isAllowedExtension(kind, fileExtension(file.name))) {
      const label = kind === "static" ? "Static reports" : "Runnable reports";
      nextErrors.file = `${label} must be one of: ${ALLOWED_EXTENSIONS[kind].join(", ")}`;
    }

    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean) || !category || !kind || !file) {
      return;
    }

    // Only metadata is sent. The selected file supplies the file type and is
    // never read, uploaded, or stored. The server validates everything again.
    setSaving(true);
    try {
      const saved = await submitReport({
        name: name.trim(),
        description: description.trim(),
        category,
        kind,
        fileType: normalizeExtension(fileExtension(file.name)),
        tags,
      });
      setSubmitted(saved);
    } catch (error) {
      if (error instanceof ReportApiError) {
        setErrors(toFormErrors(error.fieldErrors));
      }
      setSaveError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setName("");
    setDescription("");
    setTagsInput("");
    setCategory("");
    setKind("");
    setFile(null);
    setErrors({});
    setSaveError(null);
    setSubmitted(null);
    setFormKey((key) => key + 1);
  }

  if (submitted) {
    return (
      <Card
        title="Report details saved"
        subtitle="These details are saved and will appear in the report library. The file you selected was not uploaded or stored, so this report has no file to open yet."
      >
        <div className="stacked-form">
          <ReportCard report={submitted} />
          <div className="inline-actions">
            <Button variant="button2" onClick={resetForm}>
              Add another
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
      subtitle="Saves the report's details to the library. Files are not stored yet: the file you choose only sets the file type."
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
          maxLength={REPORT_FIELDS.name.maxLength}
          error={errors.name}
        />

        <Textarea
          label="Description"
          rows={3}
          placeholder="What does this report cover, and for whom?"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={REPORT_FIELDS.description.maxLength}
          error={errors.description}
        />

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
          hint="Used only to record the file type. The file itself is not uploaded or stored yet."
          error={errors.file}
        />

        {saveError && (
          <div className="inline-actions" role="alert">
            <Badge variant="badge6">Not saved</Badge>
            <span>{saveError}</span>
          </div>
        )}

        <div className="inline-actions">
          <Button type="submit" variant="button1" disabled={saving}>
            {saving ? "Saving…" : "Submit Report"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
