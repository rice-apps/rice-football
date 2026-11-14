import { createPffClient } from "../../src/lib/pff/client";

async function main() {
  const client = await createPffClient();
  const franchises = await client.getFranchises();
  const riceMatches = franchises.filter(
    (franchise) => franchise.name.trim().toLowerCase() === "rice owls",
  );

  if (riceMatches.length !== 1) {
    throw new Error(`Expected one Rice Owls franchise, found ${riceMatches.length}.`);
  }

  console.log(`Retrieved ${franchises.length} NCAA franchise records.`);
  console.log(`Rice Owls franchise ID: ${riceMatches[0].id}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "PFF sample fetch failed.");
  process.exitCode = 1;
});
