import type { DictionaryStructure } from "./catalog";

export function searchDictionary(catalog: DictionaryStructure[], search: string) {
  const query = search.trim().toLowerCase();
  const matches = (values: (string | undefined)[]) =>
    values.some((value) => value?.toLowerCase().includes(query));

  // A structure match keeps all its fields; field matches retain source context.
  return catalog.flatMap((structure) => {
    const structureMatches = matches([
      structure.name, structure.source, structure.purpose, structure.classification,
      structure.nullabilityNotes, ...structure.limitations,
    ]);
    const fields = structureMatches ? structure.fields : structure.fields.filter((field) =>
      matches([field.name, field.description, field.relationship, field.uncertainty]),
    );
    return fields.length ? [{ structure, fields }] : [];
  });
}
