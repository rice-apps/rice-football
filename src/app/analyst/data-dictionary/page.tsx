import type { Metadata } from "next";
import AppShell from "@/components/layout/AppShell";
import DataDictionary from "@/components/data-dictionary/DataDictionary";

export const metadata: Metadata = {
  title: "Data Dictionary | Rice Football Analytics",
};

export default function DataDictionaryPage() {
  return (
    <AppShell
      eyebrow="Analyst tools"
      title="Data Dictionary"
      subtitle="Find out what each field means, where it comes from, and how to use it."
    >
      <DataDictionary />
    </AppShell>
  );
}
