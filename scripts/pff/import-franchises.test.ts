import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { upsertPffFranchises } from "../../src/lib/pff/db";
import type { PffFranchise } from "../../src/lib/pff/types";
import { importPffFranchises } from "./import-franchises";

const envNames = ["PFF_API_KEY", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY"];
const originalEnv = envNames.map((name) => process.env[name]);
const testUrl = "https://fictional-project.supabase.test";
const testKey = "test-secret-key";
const testToken = "header.payload.signature";
const mayHaveWritten = "Some rows may already have been written; rerunning the import is safe.";

const sample: PffFranchise[] = [
  { id: 1, name: "Example University", league_id: 10, league: "Example league", sportradar_id: null },
  { id: 2, name: "Fictional College", league_id: 10, league: "Example league", sportradar_id: "sr:fictional:2" },
];

beforeEach(() => {
  process.env.PFF_API_KEY = "test-pff-key";
  process.env.NEXT_PUBLIC_SUPABASE_URL = testUrl;
  process.env.SUPABASE_SECRET_KEY = testKey;
});

afterEach(() => {
  mock.restoreAll();
  envNames.forEach((name, index) => {
    const value = originalEnv[index];
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  });
});

type SupabaseHandler = (method: string | undefined, url: URL, init?: RequestInit) => Response;

// PFF requests get fictional vendor responses; everything else goes to the fake Supabase handler.
function mockServices(supabase: SupabaseHandler, pffBody: unknown = { franchises: sample }) {
  return mock.method(globalThis, "fetch", async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.href === "https://api.profootballfocus.com/auth/login") {
      return Response.json({ jwt: testToken });
    }
    if (url.href === "https://api.profootballfocus.com/v1/ncaa/franchises") {
      return Response.json(pffBody);
    }
    return supabase(init?.method, url, init);
  });
}

function requestList(fetchMock: ReturnType<typeof mockServices>): string[] {
  return fetchMock.mock.calls.map(
    (call) => `${call.arguments[1]?.method} ${new URL(String(call.arguments[0])).pathname}`,
  );
}

function countResponse(count: number, status = 200): Response {
  return new Response(null, { status, headers: { "Content-Range": `*/${count}` } });
}

test("checks the stored count, then upserts one bulk request with a shared fetched_at", async () => {
  const withExtraField = [{ ...sample[0], extra_vendor_field: "ignored" }, sample[1]];
  let postedRows: Record<string, unknown>[] = [];

  const fetchMock = mockServices((method, url, init) => {
    const headers = new Headers(init?.headers);
    assert.equal(url.origin, testUrl);
    assert.equal(url.pathname, "/rest/v1/pff_franchises");
    assert.equal(headers.get("apikey"), testKey);
    assert.ok(init?.signal instanceof AbortSignal);

    if (method === "HEAD") {
      assert.equal(url.searchParams.get("select"), "id");
      assert.match(headers.get("Prefer") ?? "", /count=exact/);
      return countResponse(0);
    }

    assert.equal(method, "POST");
    assert.equal(url.searchParams.get("on_conflict"), "id");
    assert.equal(url.searchParams.get("columns"), '"id","name","league_id","league","sportradar_id","fetched_at"');
    assert.match(headers.get("Prefer") ?? "", /resolution=merge-duplicates/);
    assert.match(headers.get("Prefer") ?? "", /count=exact/);
    assert.doesNotMatch(headers.get("Prefer") ?? "", /return=representation/);
    postedRows = JSON.parse(String(init?.body));
    return countResponse(postedRows.length, 201);
  });

  assert.equal(await upsertPffFranchises(withExtraField), 2);
  assert.deepEqual(requestList(fetchMock), ["HEAD /rest/v1/pff_franchises", "POST /rest/v1/pff_franchises"]);

  const fetchedAt = postedRows[0].fetched_at;
  assert.equal(new Date(String(fetchedAt)).toISOString(), fetchedAt);
  assert.deepEqual(postedRows, sample.map((franchise) => ({ ...franchise, fetched_at: fetchedAt })));
});

test("imports from PFF before writing, logs counts only, and reruns update the same keys", async () => {
  const table = new Map<number, Record<string, unknown>>();
  const fakeDatabase: SupabaseHandler = (method, url, init) => {
    if (method === "HEAD") {
      return countResponse(table.size);
    }
    const rows: Record<string, unknown>[] = JSON.parse(String(init?.body));
    for (const row of rows) {
      table.set(Number(row.id), row);
    }
    return countResponse(rows.length, 201);
  };

  const fetchMock = mockServices(fakeDatabase);
  const logMock = mock.method(console, "log", () => {});
  await importPffFranchises();

  assert.deepEqual(requestList(fetchMock), [
    "POST /auth/login",
    "GET /v1/ncaa/franchises",
    "HEAD /rest/v1/pff_franchises",
    "POST /rest/v1/pff_franchises",
  ]);
  assert.equal(new Headers(fetchMock.mock.calls[1].arguments[1]?.headers).get("Authorization"), `Bearer ${testToken}`);
  assert.deepEqual(logMock.mock.calls.map((call) => call.arguments.join(" ")), [
    "Source: PFF. Scope: NCAA franchises.",
    "Collected 2 franchise records.",
    "Upserted 2 franchise records into pff_franchises.",
  ]);

  mock.restoreAll();
  const changed = [{ ...sample[0], name: "Example University Renamed" }, { ...sample[1], sportradar_id: null }];
  mockServices(fakeDatabase, { franchises: changed });
  mock.method(console, "log", () => {});
  await importPffFranchises();

  assert.deepEqual([...table.keys()].sort(), [1, 2]);
  assert.equal(table.get(1)?.name, "Example University Renamed");
  assert.equal(table.get(2)?.sportradar_id, null);
});

test("rejects invalid, empty, unsafe or duplicate collections before any database request", async () => {
  const fetchMock = mock.method(globalThis, "fetch");
  const invalidCollections = [
    [],
    [null],
    [{ ...sample[0], id: 2 ** 53 }],
    [{ ...sample[0], id: "1" }],
    [{ ...sample[0], league_id: 1.5 }],
    [{ ...sample[0], name: " " }],
    [sample[0], { ...sample[1], id: sample[0].id }],
  ];

  for (const collection of invalidCollections) {
    await assert.rejects(upsertPffFranchises(collection as unknown as PffFranchise[]), /No rows were written\.$/);
  }
  await assert.rejects(upsertPffFranchises([sample[0], sample[0]]), {
    message: "PFF franchise import found duplicate franchise ID 1. No rows were written.",
  });
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("source failures and empty source collections make no database requests", async () => {
  const noDatabase: SupabaseHandler = () => assert.fail("database should not be contacted");
  const cases = [
    [{ franchises: [] }, /needs at least one franchise/],
    [{ franchises: [{ ...sample[0], id: "1" }] }, /PFF franchises returned an unexpected response/],
  ] as const;

  for (const [pffBody, message] of cases) {
    const fetchMock = mockServices(noDatabase, pffBody);
    mock.method(console, "log", () => {});
    await assert.rejects(importPffFranchises(), message);
    assert.deepEqual(requestList(fetchMock), ["POST /auth/login", "GET /v1/ncaa/franchises"]);
    mock.restoreAll();
  }

  const fetchMock = mock.method(globalThis, "fetch");
  mock.method(console, "log", () => {});
  delete process.env.PFF_API_KEY;
  await assert.rejects(importPffFranchises(), /PFF_API_KEY is missing/);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("stored-count failures stop before any write", async () => {
  const cases = [
    [() => new Response(null, { status: 500 }), "PFF franchise row count failed (HTTP 500). No rows were written."],
    [
      () => { throw new Error(`${testUrl} ${testKey}`); },
      "PFF franchise row count failed (network error or timeout). No rows were written.",
    ],
    [() => new Response(null), "PFF franchise row count returned an unexpected response. No rows were written."],
    [
      () => new Response(null, { headers: { "Content-Range": "*/*" } }),
      "PFF franchise row count returned an unexpected response. No rows were written.",
    ],
  ] as const;

  for (const [headResponse, message] of cases) {
    const fetchMock = mockServices(() => headResponse());
    await assert.rejects(upsertPffFranchises(sample), { message });
    assert.deepEqual(requestList(fetchMock), ["HEAD /rest/v1/pff_franchises"]);
    mock.restoreAll();
  }
});

test("rejects a collection smaller than the stored row count", async () => {
  const fetchMock = mockServices(() => countResponse(3));
  await assert.rejects(upsertPffFranchises(sample), {
    message: "PFF returned 2 franchises but pff_franchises already has 3. No rows were written.",
  });
  assert.deepEqual(requestList(fetchMock), ["HEAD /rest/v1/pff_franchises"]);
});

test("failed or unconfirmed upserts say rows may have changed without leaking details", async () => {
  const cases = [
    [
      () => Response.json({ message: `${testKey} constraint details` }, { status: 500 }),
      `PFF franchise upsert failed (HTTP 500). ${mayHaveWritten}`,
    ],
    [() => { throw new Error(testKey); }, `PFF franchise upsert failed (network error or timeout). ${mayHaveWritten}`],
    [() => new Response(null, { status: 201 }), `PFF franchise upsert could not confirm 2 written rows. ${mayHaveWritten}`],
    [() => countResponse(1, 201), `PFF franchise upsert could not confirm 2 written rows. ${mayHaveWritten}`],
  ] as const;

  for (const [postResponse, message] of cases) {
    const fetchMock = mockServices((method) => (method === "HEAD" ? countResponse(0) : postResponse()));
    await assert.rejects(upsertPffFranchises(sample), { message });
    assert.deepEqual(requestList(fetchMock), ["HEAD /rest/v1/pff_franchises", "POST /rest/v1/pff_franchises"]);
    mock.restoreAll();
  }
});
