// Node-only: keep this module out of browser components.
import process from "node:process";
import type { PffFranchise } from "./types";

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

function isFranchise(value: unknown): value is PffFranchise {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (
    "id" in value && Number.isSafeInteger(value.id) &&
    "name" in value && typeof value.name === "string" && value.name.trim() !== "" &&
    "league_id" in value && Number.isSafeInteger(value.league_id) &&
    "league" in value && typeof value.league === "string" &&
    "sportradar_id" in value &&
    (value.sportradar_id === null || typeof value.sportradar_id === "string")
  );
}

export async function createPffClient() {
  const jwt = await authenticatePff();

  async function getFranchises(): Promise<PffFranchise[]> {
    let response: Response;
    try {
      response = await fetch(`${PFF_BASE_URL}/v1/ncaa/franchises`, {
        method: "GET",
        headers: { Authorization: `Bearer ${jwt}` },
        redirect: "error",
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      throw new Error("PFF franchises request failed (network error or timeout).");
    }

    if (!response.ok) {
      throw new Error(`PFF franchises request failed (HTTP ${response.status}).`);
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new Error("PFF franchises response could not be read as JSON.");
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("franchises" in body) ||
      !Array.isArray(body.franchises) ||
      !body.franchises.every(isFranchise)
    ) {
      throw new Error("PFF franchises returned an unexpected response.");
    }

    return body.franchises;
  }

  return { getFranchises };
}
