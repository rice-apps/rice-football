import type { Metadata } from "next";
import { CsvUploader } from "@/components/upload/CsvUploader";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "CSV Upload (dev) | Rice Football",
};

// Development prototype for generic CSV parsing and preview.
// Not a final product screen; it may be moved, redesigned, or removed.
export default function CsvUploadPage() {
  return (
    <main className={styles.page}>
      <h1>CSV Upload Preview</h1>
      <p className={styles.intro}>
        Development prototype. Choose any CSV file to check it and preview its contents. The file is
        read in your browser and is not uploaded or saved anywhere.
      </p>
      <CsvUploader />
    </main>
  );
}
