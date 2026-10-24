import type { Metadata } from "next";
import { JsonUploader } from "@/components/upload/JsonUploader";
import styles from "./page.module.css";
import type { JsonSchema } from "@/lib/json/validateJson";

const demoSchema: JsonSchema = {
  playerId: { type: "string", required: true },
  speed: { type: "number", required: true },
  x: { type: "number", required: false },
  y: { type: "number", required: false },
};

export const metadata: Metadata = {
  title: "JSON Upload (dev) | Rice Football",
};

export default function JsonUploadPage() {
  return (
    <main className={styles.page}>
      <h1>JSON Upload Preview</h1>
      <p className={styles.intro}>
        Development prototype. Choose a JSON object or an array of objects to validate and preview.
        The file is read in your browser and is not uploaded or saved anywhere. Validation uses a 
        demo schema: playerId (string, required), speed (number, required), x and y (numbers, optional).
      </p>
      <JsonUploader schema={demoSchema} />
    </main>
  );
}
