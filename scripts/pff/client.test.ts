import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { authenticatePff, createPffClient } from "../../src/lib/pff/client";

const originalKey = process.env.PFF_API_KEY;
const testToken = "header.payload.signature";

beforeEach(() => {
  process.env.PFF_API_KEY = "test-key";
});

afterEach(() => {
  mock.restoreAll();
  if (originalKey === undefined) {
    delete process.env.PFF_API_KEY;
  } else {
    process.env.PFF_API_KEY = originalKey;
  }
});

test("sends the key to login and returns the JWT", async () => {
  process.env.PFF_API_KEY = " test-key \n";
  const fetchMock = mock.method(globalThis, "fetch", async (url: Parameters<typeof fetch>[0], init?: RequestInit) => {
    assert.equal(url, "https://api.profootballfocus.com/auth/login");
    assert.equal(init?.method, "POST");
    assert.equal(new Headers(init?.headers).get("x-api-key"), "test-key");
    assert.equal(init?.redirect, "error");
    assert.ok(init?.signal instanceof AbortSignal);
    return Response.json({ jwt: testToken });
  });

  assert.equal(await authenticatePff(), testToken);
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("rejects missing or blank credentials before sending a request", async () => {
  const fetchMock = mock.method(globalThis, "fetch");
  delete process.env.PFF_API_KEY;
  await assert.rejects(authenticatePff(), /PFF_API_KEY is missing/);
  process.env.PFF_API_KEY = "   ";
  await assert.rejects(authenticatePff(), /PFF_API_KEY is missing/);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("reports HTTP failures without exposing response bodies", async () => {
  for (const status of [401, 403, 500]) {
    mock.method(globalThis, "fetch", async () =>
      new Response(`test-key ${testToken}`, { status }),
    );
    await assert.rejects(authenticatePff(), {
      message: `PFF authentication failed (HTTP ${status}).`,
    });
    mock.restoreAll();
  }
});

test("rejects malformed JSON without exposing its contents", async () => {
  mock.method(globalThis, "fetch", async () => new Response("test-key invalid JSON"));
  await assert.rejects(authenticatePff(), {
    message: "PFF authentication response could not be read as JSON.",
  });
});

test("rejects unexpected authentication structures and malformed tokens", async () => {
  for (const body of [null, [], {}, { jwt: null }, { jwt: 42 }, { jwt: "" }, { jwt: "bad token" }]) {
    mock.method(globalThis, "fetch", async () => Response.json(body));
    await assert.rejects(authenticatePff(), /unexpected response: expected a JWT/);
    mock.restoreAll();
  }
});

test("sanitizes network errors that could contain credentials", async () => {
  mock.method(globalThis, "fetch", async () => {
    throw new Error(`request failed with test-key ${testToken}`);
  });
  await assert.rejects(authenticatePff(), {
    message: "PFF authentication request failed (network error or timeout).",
  });
});

test("sanitizes errors while reading the response body", async () => {
  mock.method(globalThis, "fetch", async () => new Response(new ReadableStream({
    start(controller) {
      controller.error(new Error(`test-key ${testToken}`));
    },
  })));
  await assert.rejects(authenticatePff(), {
    message: "PFF authentication response could not be read as JSON.",
  });
});

const sampleFranchise = {
  id: 123,
  name: "Example University",
  league_id: 1,
  league: "Example league",
  sportradar_id: null,
};

test("reuses one login across sequential and concurrent franchise requests", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async (url: Parameters<typeof fetch>[0], init?: RequestInit) => {
    if (url === "https://api.profootballfocus.com/auth/login") {
      return Response.json({ jwt: testToken });
    }

    assert.equal(url, "https://api.profootballfocus.com/v1/ncaa/franchises");
    assert.equal(init?.method, "GET");
    const headers = new Headers(init?.headers);
    assert.equal(headers.get("Authorization"), `Bearer ${testToken}`);
    assert.equal(headers.get("x-api-key"), null);
    assert.equal(init?.redirect, "error");
    assert.ok(init?.signal instanceof AbortSignal);
    return Response.json({ franchises: [sampleFranchise], leagues: [] });
  });

  const client = await createPffClient();
  assert.deepEqual(await client.getFranchises(), [sampleFranchise]);
  const results = await Promise.all([client.getFranchises(), client.getFranchises()]);
  assert.deepEqual(results, [[sampleFranchise], [sampleFranchise]]);
  const loginCalls = fetchMock.mock.calls.filter(
    (call) => call.arguments[0] === "https://api.profootballfocus.com/auth/login",
  );
  assert.equal(loginCalls.length, 1);
  assert.equal(fetchMock.mock.callCount(), 4);
});

test("does not request franchises when authentication fails", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => new Response("test-key", { status: 401 }));
  await assert.rejects(createPffClient(), /authentication failed \(HTTP 401\)/);
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("reports franchise HTTP errors without leaking keys or tokens", async () => {
  for (const status of [401, 403, 500]) {
    let calls = 0;
    mock.method(globalThis, "fetch", async () => {
      calls += 1;
      if (calls === 1) return Response.json({ jwt: testToken });
      return new Response(`test-key ${testToken}`, { status });
    });
    const client = await createPffClient();
    await assert.rejects(client.getFranchises(), {
      message: `PFF franchises request failed (HTTP ${status}).`,
    });
    assert.equal(calls, 2);
    mock.restoreAll();
  }
});

test("rejects unexpected franchise envelopes and field types", async () => {
  for (const body of [null, [], {}, { franchises: {} }, { franchises: [null] },
    { franchises: [{ ...sampleFranchise, id: "123" }] },
    { franchises: [{ ...sampleFranchise, name: " " }] },
    { franchises: [{ ...sampleFranchise, sportradar_id: 42 }] }]) {
    const client = await mockFranchiseClient(() => Response.json(body));
    await assert.rejects(client.getFranchises(), /unexpected response/);
    mock.restoreAll();
  }
});

test("accepts an empty franchise list", async () => {
  const client = await mockFranchiseClient(() => Response.json({ franchises: [] }));
  assert.deepEqual(await client.getFranchises(), []);
});

test("sanitizes invalid JSON and response stream errors in franchises", async () => {
  for (const response of [new Response("test-key invalid JSON"), new Response(new ReadableStream({
    start(controller) { controller.error(new Error(testToken)); },
  }))]) {
    const client = await mockFranchiseClient(() => response);
    await assert.rejects(client.getFranchises(), {
      message: "PFF franchises response could not be read as JSON.",
    });
    mock.restoreAll();
  }
});

test("sanitizes franchise network errors", async () => {
  const client = await mockFranchiseClient(() => { throw new Error(testToken); });
  await assert.rejects(client.getFranchises(), {
    message: "PFF franchises request failed (network error or timeout).",
  });
});

async function mockFranchiseClient(franchiseResponse: () => Response) {
  mock.method(globalThis, "fetch", async (url: Parameters<typeof fetch>[0]) => {
    if (url === "https://api.profootballfocus.com/auth/login") {
      return Response.json({ jwt: testToken });
    }
    return franchiseResponse();
  });
  return createPffClient();
}
