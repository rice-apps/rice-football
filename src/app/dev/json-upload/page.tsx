import type { Metadata } from "next";
import { JsonUploader } from "@/components/upload/JsonUploader";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "JSON Upload (dev) | Rice Football",
};

export default function JsonUploadPage() {
  return (
    <main className={styles.page}>
      <h1>JSON Upload Preview</h1>
      <p className={styles.intro}>
        Development prototype. Choose a JSON object or an array of objects to validate and preview.
        The file is read in your browser and is not uploaded or saved anywhere.
      </p>
      <JsonUploader />
    </main>
  );
}
