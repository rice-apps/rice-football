import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { getPffFranchise, searchPffFranchises } from "../../src/lib/pff/db";

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalKey = process.env.SUPABASE_SECRET_KEY;
const testUrl = "https://fictional-project.supabase.test";
const testKey = "test-secret-key";

const franchise = {
  id: 123,
  name: "Example University",
  league_id: 1,
  league: "Example league",
  sportradar_id: null,
};

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = testUrl;
  process.env.SUPABASE_SECRET_KEY = testKey;
});

afterEach(() => {
  mock.restoreAll();
  restoreEnv("NEXT_PUBLIC_SUPABASE_URL", originalUrl);
  restoreEnv("SUPABASE_SECRET_KEY", originalKey);
});

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

function mockFetch(respond: (url: URL, init?: RequestInit) => Response) {
  return mock.method(globalThis, "fetch", async (input: Parameters<typeof fetch>[0], init?: RequestInit) =>
    respond(new URL(String(input)), init),
  );
}

test("looks up one franchise by exact ID and returns only vendor fields", async () => {
  const fetchMock = mockFetch((url, init) => {
    assert.equal(url.origin, testUrl);
    assert.equal(url.pathname, "/rest/v1/pff_franchises");
    assert.equal(url.searchParams.get("select"), "id,name,league_id,league,sportradar_id");
    assert.equal(url.searchParams.get("id"), "eq.123");
    assert.equal(init?.method, "GET");
    assert.equal(new Headers(init?.headers).get("apikey"), testKey);
    assert.ok(init?.signal instanceof AbortSignal);
    assert.equal(init?.signal?.aborted, false);
    return Response.json([{ ...franchise, fetched_at: "2026-11-14T00:00:00Z" }]);
  });

  assert.deepEqual(await getPffFranchise(123), franchise);
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("returns null when no franchise has the ID", async () => {
  mockFetch(() => Response.json([]));
  assert.equal(await getPffFranchise(456), null);
});

test("rejects unsafe or non-integer IDs before any request", async () => {
  const fetchMock = mock.method(globalThis, "fetch");
  for (const id of [1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53, "123" as unknown as number]) {
    await assert.rejects(getPffFranchise(id), { message: "PFF franchise ID must be a safe integer." });
  }
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("searches a trimmed literal name with stable order and a 50-row limit", async () => {
  const rows = [
    franchise,
    { id: 124, name: "Example University", league_id: 1, league: "Example league", sportradar_id: "sr:fictional:1" },
  ];
  const fetchMock = mockFetch((url, init) => {
    assert.equal(url.pathname, "/rest/v1/pff_franchises");
    assert.equal(url.searchParams.get("name"), "imatch.Example");
    assert.equal(url.searchParams.get("order"), "name.asc,id.asc");
    assert.equal(url.searchParams.get("limit"), "50");
    assert.equal(init?.method, "GET");
    assert.ok(init?.signal instanceof AbortSignal);
    return Response.json(rows);
  });

  assert.deepEqual(await searchPffFranchises("  Example \n"), rows);
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("escapes regex, wildcard and backslash characters so they match literally", async () => {
  mockFetch((url) => {
    assert.equal(
      url.searchParams.get("name"),
      String.raw`imatch.A\*B%C_D\\E\.F\(G\)\[H\]\{I\}\|J\?K\+L\^M\$N`,
    );
    return Response.json([]);
  });

  assert.deepEqual(await searchPffFranchises(String.raw`  A*B%C_D\E.F(G)[H]{I}|J?K+L^M$N  `), []);
});

test("rejects blank search names before any request", async () => {
  const fetchMock = mock.method(globalThis, "fetch");
  for (const name of ["", "   ", "\n\t", undefined as unknown as string]) {
    await assert.rejects(searchPffFranchises(name), { message: "PFF franchise search name must not be blank." });
  }
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("fails clearly without Supabase credentials and without echoing them", async () => {
  const fetchMock = mock.method(globalThis, "fetch");
  const missing = "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required. Set them in .env.local.";

  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  await assert.rejects(getPffFranchise(123), { message: missing });

  process.env.NEXT_PUBLIC_SUPABASE_URL = testUrl;
  process.env.SUPABASE_SECRET_KEY = "   ";
  await assert.rejects(searchPffFranchises("Example"), { message: missing });

  process.env.SUPABASE_SECRET_KEY = testKey;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url";
  await assert.rejects(getPffFranchise(123), { message: "NEXT_PUBLIC_SUPABASE_URL is not a valid Supabase URL." });

  assert.equal(fetchMock.mock.callCount(), 0);
});

test("rejects unexpected lookup rows and unsafe IDs", async () => {
  const missingLeague = { id: 123, name: "Example University", league_id: 1, sportradar_id: null };
  for (const body of [
    "text",
    42,
    [{ ...franchise, id: "123" }],
    [{ ...franchise, id: 999 }],
    [{ ...franchise, league_id: 2 ** 53 }],
    [{ ...franchise, name: " " }],
    [{ ...franchise, sportradar_id: 42 }],
    [missingLeague],
  ]) {
    mockFetch(() => Response.json(body));
    await assert.rejects(getPffFranchise(123), { message: "PFF franchise lookup returned an unexpected response." });
    mock.restoreAll();
  }
});

test("rejects unexpected search results", async () => {
  const tooMany = Array.from({ length: 51 }, (_, index) => ({ ...franchise, id: index + 1 }));
  for (const body of [{}, null, [null], [franchise, { ...franchise, id: 1.5 }], tooMany]) {
    mockFetch(() => Response.json(body));
    await assert.rejects(searchPffFranchises("Example"), {
      message: "PFF franchise search returned an unexpected response.",
    });
    mock.restoreAll();
  }
});

test("reports HTTP failures once without leaking database error bodies", async () => {
  for (const status of [401, 404, 500, 503]) {
    const fetchMock = mockFetch(() =>
      Response.json({ message: `${testKey} ${testUrl} relation details`, code: "XX000" }, { status }),
    );
    await assert.rejects(getPffFranchise(123), { message: `PFF franchise lookup failed (HTTP ${status}).` });
    await assert.rejects(searchPffFranchises("Example"), { message: `PFF franchise search failed (HTTP ${status}).` });
    assert.equal(fetchMock.mock.callCount(), 2);
    mock.restoreAll();
  }
});

test("sanitizes thrown network, abort and response stream errors", async () => {
  const failures = [
    () => { throw new Error(`connect failed ${testUrl} ${testKey}`); },
    () => { throw new DOMException(`aborted ${testKey}`, "AbortError"); },
    () => new Response(new ReadableStream({
      start(controller) { controller.error(new Error(testKey)); },
    })),
  ];
  for (const failure of failures) {
    const fetchMock = mockFetch(failure);
    await assert.rejects(getPffFranchise(123), { message: "PFF franchise lookup failed (network error or timeout)." });
    await assert.rejects(searchPffFranchises("Example"), {
      message: "PFF franchise search failed (network error or timeout).",
    });
    assert.equal(fetchMock.mock.callCount(), 2);
    mock.restoreAll();
  }
});

test("sanitizes successful responses that are not JSON", async () => {
  mockFetch(() => new Response(`${testKey} not JSON`));
  await assert.rejects(getPffFranchise(123), { message: "PFF franchise lookup returned an unexpected response." });
  await assert.rejects(searchPffFranchises("Example"), {
    message: "PFF franchise search returned an unexpected response.",
  });
});
