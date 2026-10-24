"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { parseJson } from "@/lib/json/parseJson";
import { validateJson } from "@/lib/json/validateJson";
import styles from "./JsonUploader.module.css";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const PREVIEW_RECORDS = 20;
const PREVIEW_CHARACTERS = 20_000;

type UploadResult = {
  fileName: string;
  errors: string[];
  summary?: string;
  preview?: string;
  truncated?: boolean;
};

export function JsonUploader() {
  const [result, setResult] = useState<UploadResult | null>(null);
  const [isReading, setIsReading] = useState(false);
  const latestRead = useRef(0);

  async function handleFile(file: File) {
    const readId = ++latestRead.current;
    setResult(null);
    setIsReading(false);
    if (!file.name.toLowerCase().endsWith(".json")) {
      setResult({ fileName: file.name, errors: ["Choose a file ending in .json."] });
      return;
    }
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      setResult({
        fileName: file.name,
        errors: [file.size === 0 ? "The file is empty." : "The preview limit is 5 MB."],
      });
      return;
    }

    setIsReading(true);
    try {
      const text = await file.text();
      if (readId !== latestRead.current) return;
      const parsed = parseJson(text);
      if (!parsed.ok) {
        setResult({ fileName: file.name, errors: [parsed.error] });
        return;
      }

      // No vendor schema is assumed: accept an object or an array of objects.
      const issues = validateJson(parsed.data, {});
      if (issues.length > 0) {
        const errors = issues.slice(0, 20).map((issue) =>
          `${issue.recordIndex === null ? "" : `Record ${issue.recordIndex + 1}: `}${issue.message}`,
        );
        if (issues.length > 20) errors.push(`${issues.length - 20} more issues.`);
        setResult({ fileName: file.name, errors });
        return;
      }

      const previewData = Array.isArray(parsed.data) ? parsed.data.slice(0, PREVIEW_RECORDS) : parsed.data;
      const preview = JSON.stringify(previewData, null, 2);
      setResult({
        fileName: file.name,
        errors: [],
        summary: Array.isArray(parsed.data)
          ? `${parsed.data.length} records. Showing up to ${PREVIEW_RECORDS}.`
          : "JSON object. Structure is valid.",
        preview: preview.slice(0, PREVIEW_CHARACTERS),
        truncated: preview.length > PREVIEW_CHARACTERS,
      });
    } catch {
      if (readId === latestRead.current) {
        setResult({ fileName: file.name, errors: ["The file could not be read. Choose it again."] });
      }
    } finally {
      if (readId === latestRead.current) setIsReading(false);
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void handleFile(file);
    event.target.value = "";
  }

  return (
    <div className={styles.uploader}>
      <label className={styles.picker}>
        Choose JSON file
        <input type="file" accept=".json,application/json" onChange={handleChange} />
      </label>
      <p className={styles.hint}>Object or array of objects · up to 5 MB</p>
      <div aria-live="polite" aria-busy={isReading}>
        {isReading && <p>Reading file…</p>}
        {result && (
          <section className={styles.results} aria-label="JSON result">
            <h2>{result.fileName}</h2>
            {result.errors.length > 0 ? (
              <ul className={styles.errors}>
                {result.errors.map((error, index) => <li key={index}>{error}</li>)}
              </ul>
            ) : (
              <>
                <p>{result.summary}</p>
                {result.truncated && <p>Preview shortened to {PREVIEW_CHARACTERS.toLocaleString()} characters.</p>}
                <pre className={styles.preview} tabIndex={0} aria-label="JSON preview">{result.preview}</pre>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
