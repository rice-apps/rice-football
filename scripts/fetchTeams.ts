import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { client, getTeams } from 'cfbd';

async function main() {
  const apiKey = process.env.CFBD_API_KEY;

  if (!apiKey) {
    throw new Error('CFBD_API_KEY is required');
  }

  client.setConfig({
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const response = await getTeams({});

  if (response.error) {
    throw response.error;
  }

  const outputDirectory = path.join(process.cwd(), 'samples', 'cfbd');
  const outputPath = path.join(outputDirectory, 'teams.json');

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, JSON.stringify(response.data ?? [], null, 2) + '\n', 'utf8');

  console.log(`Wrote ${response.data?.length ?? 0} teams to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});