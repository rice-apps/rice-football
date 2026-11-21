import process from "node:process";
import { pathToFileURL } from "node:url";
import { createPffClient } from "../../src/lib/pff/client";
import { upsertPffFranchises } from "../../src/lib/pff/db";

export async function importPffFranchises(): Promise<void> {
  console.log("Source: PFF. Scope: NCAA franchises.");

  const client = await createPffClient();
  const franchises = await client.getFranchises();
  console.log(`Collected ${franchises.length} franchise records.`);

  const upserted = await upsertPffFranchises(franchises);
  console.log(`Upserted ${upserted} franchise records into pff_franchises.`);
}

// Run only as a command, so tests can import importPffFranchises without starting an import.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  importPffFranchises().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "PFF franchise import failed.");
    process.exitCode = 1;
  });
}
