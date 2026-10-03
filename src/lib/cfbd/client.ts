import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { client } from 'cfbd';

const SAMPLES_DIRECTORY = path.join(process.cwd(), 'samples', 'cfbd');
const DEFAULT_SAMPLE_LIMIT = 25;

let isConfigured = false;

/* Attaches the CFBD API key to the shared cfbd client only once */
export function configureCfbdClient(): void {
  if (isConfigured) {
    return;
  }

  const apiKey = process.env.CFBD_API_KEY;

  if (!apiKey) {
    throw new Error('CFBD_API_KEY is required');
  }

  client.setConfig({
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  isConfigured = true;
}

type CfbdResult<T> = {
  data?: T;
  error?: unknown;
  response: Response;
};

/* Runs a cfbd SDK call with the client configured and unwraps the result. */
export async function cfbdRequest<T>(call: () => Promise<CfbdResult<T>>): Promise<T> {
  configureCfbdClient();

  const { data, error, response } = await call();

  if (error !== undefined || data === undefined) {
    throw new Error(
      `CFBD request failed (${response.status} ${response.statusText}): ${JSON.stringify(error)}`,
    );
  }

  return data;
}

/* Writes a response to samples/cfbd/<name>.json. Arrays are truncated according to the limit */
export async function saveSample(name: string, data: unknown, limit: number = DEFAULT_SAMPLE_LIMIT): Promise<string> {
  const sample = Array.isArray(data) ? data.slice(0, limit) : data;
  const outputPath = path.join(SAMPLES_DIRECTORY, `${name}.json`);

  await mkdir(SAMPLES_DIRECTORY, { recursive: true });
  await writeFile(outputPath, JSON.stringify(sample, null, 2) + '\n', 'utf8');

  const count = Array.isArray(data) ? `${Math.min(limit, data.length)} of ${data.length} records` : 'response';
  console.log(`Wrote ${count} to ${outputPath}`);

  return outputPath;
}

/* DEBUG/TESTING only, used to run the requests by themselves*/
export function runIfMain(moduleUrl: string, main: () => Promise<void>): void {
  const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : undefined;

  if (entryPath !== fileURLToPath(moduleUrl)) {
    return;
  }

  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
