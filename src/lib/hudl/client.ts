// Server/scripts only: do not import this module into a client component.
export const HUDL_API_URL = 'https://amf-iq-api.statsbomb.com/api';
export const HUDL_API_VERSION = 'v2023q2';
const TRACKING_HOST = 'amf-iq-tracking-prod.s3.amazonaws.com';
const MAX_RESPONSE_BYTES = 10 * 1024 * 1024;

export class HudlHttpError extends Error {
  constructor(public readonly status: number, operation: string) {
    super(`${operation} returned HTTP ${status}`);
    this.name = 'HudlHttpError';
  }
}

export type HudlResult<T> = { data: T; raw: string };

async function readJson(response: Response): Promise<{ value: unknown; raw: string }> {
  if (!response.body) throw new Error('Hudl returned an empty response');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read().catch(() => {
        throw new Error('Hudl response body could not be read (network error or timeout)');
      });
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error('Hudl response exceeded the 10 MiB sample limit');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    return { value: JSON.parse(raw), raw };
  } catch {
    throw new Error('Hudl returned invalid JSON');
  }
}

async function request(url: string, init: RequestInit, operation: string): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    // Fetch errors may contain the URL. Never print a signed URL or credential.
    throw new Error(`${operation} failed: network error, redirect, or 30s timeout`);
  }
  if (!response.ok) {
    await response.body?.cancel();
    throw new HudlHttpError(response.status, operation);
  }
  return response;
}

export async function hudlRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<HudlResult<T>> {
  const key = process.env.HUDL_API_KEY?.trim();
  if (!key) throw new Error('HUDL_API_KEY is required; load .env.local');
  const response = await request(HUDL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `apikey ${key}`,
      'Accept-Version': HUDL_API_VERSION,
    },
    body: JSON.stringify({ query, variables }),
  }, 'Hudl GraphQL request');
  const { value, raw } = await readJson(response);
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Hudl returned an invalid GraphQL response');
  }
  const envelope = value as { data?: T; errors?: unknown[] };
  if (envelope.errors?.length) {
    throw new Error(`Hudl returned ${envelope.errors.length} GraphQL error(s); check the query and account access`);
  }
  if (envelope.data === undefined || envelope.data === null) {
    throw new Error('Hudl returned no GraphQL data');
  }
  return { data: envelope.data, raw };
}

export async function downloadTracking(url: string): Promise<HudlResult<unknown>> {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.hostname !== TRACKING_HOST ||
      parsed.port || parsed.username || parsed.password) {
    throw new Error('Unexpected Hudl tracking URL; verify the download host before using it');
  }
  // The signed URL authorizes this request. Do not forward the Hudl API key.
  const response = await request(url, { method: 'GET' }, 'Hudl tracking download');
  const { value, raw } = await readJson(response);
  return { data: value, raw };
}
