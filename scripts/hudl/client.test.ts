import assert from 'node:assert/strict';
import { afterEach, beforeEach, mock, test } from 'node:test';
import { downloadTracking, HudlHttpError, hudlRequest, HUDL_API_URL } from '../../src/lib/hudl/client';

const originalKey = process.env.HUDL_API_KEY;
beforeEach(() => { process.env.HUDL_API_KEY = 'test-key'; });
afterEach(() => {
  mock.restoreAll();
  if (originalKey === undefined) delete process.env.HUDL_API_KEY;
  else process.env.HUDL_API_KEY = originalKey;
});

test('sends the documented headers and variables and preserves response text', async () => {
  const raw = '{ "data": { "games": { "items": [] } } }\n';
  const fetchMock = mock.method(globalThis, 'fetch', async (url: Parameters<typeof fetch>[0], init?: RequestInit) => {
    assert.ok(init);
    assert.equal(url, HUDL_API_URL);
    assert.equal(init.method, 'POST');
    assert.equal(init.redirect, 'error');
    assert.equal(new Headers(init.headers).get('Authorization'), 'apikey test-key');
    assert.equal(new Headers(init.headers).get('Accept-Version'), 'v2023q2');
    assert.deepEqual(JSON.parse(String(init.body)), { query: 'query Test { games }', variables: { offset: 5 } });
    return new Response(raw);
  });
  const result = await hudlRequest('query Test { games }', { offset: 5 });
  assert.equal(result.raw, raw);
  assert.deepEqual(result.data, { games: { items: [] } });
  assert.equal(fetchMock.mock.callCount(), 1);
});

test('rejects a missing key without making a request', async () => {
  delete process.env.HUDL_API_KEY;
  const fetchMock = mock.method(globalThis, 'fetch');
  await assert.rejects(hudlRequest('{ __typename }'), /HUDL_API_KEY is required/);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('handles HTTP failure without leaking the body', async () => {
  mock.method(globalThis, 'fetch', async () => new Response('test-key', { status: 401 }));
  await assert.rejects(hudlRequest('{}'), (error: unknown) => {
    assert.ok(error instanceof HudlHttpError);
    assert.equal(error.status, 401);
    assert.ok(!error.message.includes('test-key'));
    return true;
  });
});

test('rejects GraphQL errors even with HTTP 200 and partial data', async () => {
  mock.method(globalThis, 'fetch', async () => Response.json({
    data: { games: null }, errors: [{ message: 'test-key should not appear in logs' }],
  }));
  await assert.rejects(hudlRequest('{}'), /1 GraphQL error\(s\)/);
});

test('rejects malformed JSON and missing data', async () => {
  mock.method(globalThis, 'fetch', async () => new Response('<html>error</html>'));
  await assert.rejects(hudlRequest('{}'), /invalid JSON/);
  mock.restoreAll();
  mock.method(globalThis, 'fetch', async () => Response.json({ data: null }));
  await assert.rejects(hudlRequest('{}'), /no GraphQL data/);
});

test('bounds sample downloads', async () => {
  mock.method(globalThis, 'fetch', async () => new Response('x'.repeat(10 * 1024 * 1024 + 1)));
  await assert.rejects(hudlRequest('{}'), /10 MiB sample limit/);
});

test('sanitizes failures while reading a response body', async () => {
  mock.method(globalThis, 'fetch', async () => new Response(new ReadableStream({
    start(controller) { controller.error(new Error('https://example.com/?secret=1')); },
  })));
  await assert.rejects(hudlRequest('{}'), /Hudl response body could not be read \(network error or timeout\)/);
});

test('downloads a signed tracking URL without forwarding credentials', async () => {
  const url = 'https://amf-iq-tracking-prod.s3.amazonaws.com/example.json?X-Amz-Signature=example';
  mock.method(globalThis, 'fetch', async (target: Parameters<typeof fetch>[0], init?: RequestInit) => {
    assert.ok(init);
    assert.equal(target, url);
    assert.equal(init.method, 'GET');
    assert.equal(init.headers, undefined);
    assert.equal(init.redirect, 'error');
    return Response.json({ tracks: [] });
  });
  assert.deepEqual((await downloadTracking(url)).data, { tracks: [] });
});

test('rejects unexpected tracking hosts before fetching', async () => {
  const fetchMock = mock.method(globalThis, 'fetch');
  for (const url of ['http://amf-iq-tracking-prod.s3.amazonaws.com/a', 'https://example.com/a',
    'https://user:password@amf-iq-tracking-prod.s3.amazonaws.com/a']) {
    await assert.rejects(downloadTracking(url), /Unexpected Hudl tracking URL/);
  }
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('reports tracking 403 without logging the signed URL', async () => {
  mock.method(globalThis, 'fetch', async () => new Response('<Error>secret</Error>', { status: 403 }));
  await assert.rejects(downloadTracking('https://amf-iq-tracking-prod.s3.amazonaws.com/a?secret=1'),
    (error: unknown) => {
      assert.ok(error instanceof HudlHttpError);
      assert.equal(error.status, 403);
      assert.equal(error.message, 'Hudl tracking download returned HTTP 403');
      return true;
    });
});

test('sanitizes fetch failures that include a signed URL', async () => {
  mock.method(globalThis, 'fetch', async () => { throw new Error('failed: https://example.com/?secret=1'); });
  await assert.rejects(hudlRequest('{}'), (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.match(error.message, /network error/);
    assert.ok(!error.message.includes('secret'));
    return true;
  });
});
