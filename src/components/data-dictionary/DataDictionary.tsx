"use client";

import { useRef, useState } from "react";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { dictionaryCatalog, type DictionaryField } from "@/lib/data-dictionary/catalog";
import { searchDictionary } from "@/lib/data-dictionary/search";
import styles from "./DataDictionary.module.css";

const repositoryFiles = "https://github.com/rice-apps/rice-football/blob/main/";
const nullabilityLabels: Record<DictionaryField["nullability"], string> = {
  "not-null": "Cannot be null (app definition)",
  nullable: "Can be missing (null)",
  unverified: "Unverified",
};

export default function DataDictionary() {
  const [search, setSearch] = useState("");
  const searchRegion = useRef<HTMLDivElement>(null);
  const results = searchDictionary(dictionaryCatalog, search);

  function clearSearch() {
    setSearch("");
    searchRegion.current?.querySelector("input")?.focus();
  }

  return (
    <div className={styles.dictionary}>
      <Card>
        <div className={styles.stack}>
          <h2 className={styles.heading}>About this catalog</h2>
          <p>This guide covers data returned by the app, tracking data from Hudl, and sample data bundled with riceFB. It does not define the future football database.</p>
          <p>“Unverified” means a detail has not been confirmed. A missing value may be written as null or, in R, NA. IDs from different sources should not be treated as the same ID.</p>
          <p>API output means data returned by an API and prepared for the app. Raw vendor payload means data in the provider’s original format. Package fixture means sample data included with riceFB.</p>
          <div className="inline-actions">
            <a href={`${repositoryFiles}packages/riceFB/README.md`}>riceFB installation and usage</a>
          </div>
        </div>
      </Card>

      <div ref={searchRegion} role="search" aria-label="Data dictionary" className={styles.search}>
        <Input
          id="dictionary-search"
          type="search"
          label="Search structures and fields"
          hint="Try gameId, yards_gained, or timestamp. Search a data structure’s name to see all its fields."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Button variant="button2" onClick={clearSearch} disabled={!search}>Clear search</Button>
      </div>

      <p role="status" aria-live="polite" aria-atomic="true" className={styles.resultCount}>
        {results.length} of {dictionaryCatalog.length} structures · {results.reduce((count, result) => count + result.fields.length, 0)} fields shown
      </p>

      {results.length === 0 && (
        <Card>
          <div className={styles.stack}>
            <h2 className={styles.heading}>No matching structures or fields</h2>
            <p>Try a different field name or description, or clear the search to browse the catalog.</p>
            <div><Button variant="button2" onClick={clearSearch}>Show all structures</Button></div>
          </div>
        </Card>
      )}

      {results.map(({ structure, fields }) => (
        <section key={structure.id} aria-labelledby={structure.id} className={styles.structure}>
          <Card>
            <div className={styles.stack}>
              <h2 id={structure.id} className={styles.heading}>{structure.name}</h2>
              <div><Badge variant="badge2">{structure.classification}</Badge></div>
              <dl className={styles.metadata}>
                <dt>Source</dt><dd>{structure.source}</dd>
                <dt>Purpose</dt><dd>{structure.purpose}</dd>
                <dt>Missing values</dt><dd>{structure.nullabilityNotes}</dd>
              </dl>
              <div>
                <h3 className={styles.subheading}>Things to know</h3>
                <ul className={styles.list}>{structure.limitations.map((note) => <li key={note}>{note}</li>)}</ul>
              </div>
              <div role="region" aria-label={`${structure.name} fields`} tabIndex={0} className={styles.fields}>
                <Table<DictionaryField>
                  data={fields}
                  getRowKey={(field) => field.name}
                  columns={[
                    { key: "name", header: "Field", render: (_, field) => <code>{field.name}</code> },
                    { key: "type", header: "Type", render: (_, field) => <code>{field.type}</code> },
                    { key: "nullability", header: "Missing values", render: (_, field) => nullabilityLabels[field.nullability] },
                    {
                      key: "description", header: "What it means",
                      render: (_, field) => (
                        <div className={styles.meaning}>
                          <p>{field.description}</p>
                          {field.relationship && <p><strong>Related records: </strong>{field.relationship}</p>}
                          {field.uncertainty && <p className={styles.uncertainty}>{field.uncertainty}</p>}
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          </Card>
        </section>
      ))}
    </div>
  );
}
