import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { authenticatePff } from "../../src/lib/pff/client";

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
