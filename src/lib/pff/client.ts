// Node-only: keep this module out of browser components.
import process from "node:process";

const PFF_BASE_URL = "https://api.profootballfocus.com";

function readApiKey(): string {
  const apiKey = process.env.PFF_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("PFF_API_KEY is missing. Set it in .env.local.");
  }

  return apiKey;
}

export async function authenticatePff(): Promise<string> {
  const apiKey = readApiKey();

  let response: Response;
  try {
    response = await fetch(`${PFF_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "x-api-key": apiKey },
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new Error("PFF authentication request failed (network error or timeout).");
  }

  if (!response.ok) {
    throw new Error(`PFF authentication failed (HTTP ${response.status}).`);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error("PFF authentication response could not be read as JSON.");
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("jwt" in body) ||
    typeof body.jwt !== "string" ||
    !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(body.jwt)
  ) {
    throw new Error("PFF authentication returned an unexpected response: expected a JWT.");
  }

  return body.jwt;
}
