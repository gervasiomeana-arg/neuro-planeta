import { gzipSync } from 'node:zlib';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { request, type Server } from 'node:http';
import { createApiApp, type StoryGenerator } from '../server/app';
import { browserPolicy } from '../security/policy';
import { parseBoardImages, safeImageSource, MAX_BOARD_BYTES } from '../src/security/imports';

const example = { title: 'Escuela nueva', pages: Array.from({ length: 5 }, () => ({ emoji: '🏫', text: 'Puedo pedir ayuda.' })) };
const valid = { situation: 'El lunes empezamos una escuela nueva' };
async function server(production: boolean, generate?: StoryGenerator, now?: () => number) {
  const app = createApiApp({ production, generate, now });
  const listener = await new Promise<Server>(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const address = listener.address();
  assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}`;
  return { url, stop: () => new Promise<void>(resolve => { listener.close(() => resolve()); listener.closeAllConnections(); }) };
}
async function withServer(production: boolean, generate: StoryGenerator | undefined, fn: (url: string) => Promise<void>, now?: () => number) {
  const s = await server(production, generate, now);
  try { await fn(s.url); } finally { await s.stop(); }
}
const post = (url: string, body: unknown = valid, headers: Record<string, string> = {}) => fetch(`${url}/api/social-stories/draft`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
});

test('production never invokes provider, including requests with forged forwarding headers', async () => {
  let calls = 0;
  await withServer(true, async () => { calls++; return example; }, async url => {
    const result = await post(url, valid, { 'X-Forwarded-For': '127.0.0.1', 'X-Forwarded-Host': 'localhost' });
    assert.equal(result.status, 503); assert.equal(calls, 0);
    assert.equal(result.headers.get('cache-control'), 'no-store');
    assert.equal(result.headers.get('x-powered-by'), null);
    assert.equal(result.headers.get('referrer-policy'), 'no-referrer');
    assert.equal(result.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(result.headers.get('content-security-policy')?.includes("object-src 'none'"));
  });
});

test('migration and sync are disabled for exact paths, subpaths and all tested methods', async () => {
  await withServer(true, undefined, async url => {
    for (const path of ['/api/migrate', '/api/migrate/code', '/api/sync', '/api/sync/profiles']) {
      for (const method of ['GET', 'POST', 'PUT', 'DELETE']) assert.equal((await fetch(url + path, { method })).status, 410);
    }
    const unknown = await fetch(`${url}/api/unknown`);
    assert.equal(unknown.status, 404); assert.match(unknown.headers.get('content-type') || '', /json/);
  });
});

test('local development rejects cross-origin, cross-site and DNS-rebinding requests', async () => {
  let calls = 0;
  await withServer(false, async () => { calls++; return example; }, async url => {
    for (const headers of [{ Origin: 'https://attacker.invalid' }, { 'Sec-Fetch-Site': 'cross-site' }] as Record<string, string>[]) {
      assert.equal((await post(url, valid, headers)).status, 403, JSON.stringify(headers));
    }
    // Node fetch ignores Host overrides, so use an actual HTTP request here.
    const rebound = await new Promise<number>(resolve => {
      const req = request(`${url}/api/social-stories/draft`, { method: 'POST', headers: { Host: 'attacker.invalid', 'Content-Type': 'application/json' } }, response => {
        response.resume(); response.on('end', () => resolve(response.statusCode!));
      });
      req.end(JSON.stringify(valid));
    });
    assert.equal(rebound, 403);
    assert.equal(calls, 0);
    const result = await post(url, valid, { Origin: url });
    assert.equal(result.status, 200); assert.deepEqual(await result.json(), example);
  });
});

test('body parser and validation reject extra data, wrong types, malformed and oversized JSON without leaks', async () => {
  let calls = 0;
  await withServer(false, async () => { calls++; return example; }, async url => {
    for (const body of [{ situation: 'short' }, { situation: 123 }, { ...valid, profile: { name: 'PRIVATE_TEST' } }]) {
      assert.equal((await post(url, body)).status, 400);
    }
    const malformed = await fetch(`${url}/api/social-stories/draft`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{PRIVATE_TEST' });
    assert.equal(malformed.status, 400); assert.doesNotMatch(await malformed.text(), /PRIVATE_TEST|SyntaxError|stack/);
    assert.equal((await post(url, { situation: 'x'.repeat(3000) })).status, 413);
    assert.equal((await post(url, valid, { 'Content-Type': 'text/plain' })).status, 415);
    assert.equal(calls, 0);
  });
});

test('global local-development quota cannot be bypassed by spoofing IP and expires', async () => {
  let time = 0;
  await withServer(false, async () => example, async url => {
    for (let i = 0; i < 10; i++) assert.equal((await post(url, valid, { 'X-Forwarded-For': `192.0.2.${i}` })).status, 200);
    const limited = await post(url); assert.equal(limited.status, 429); assert.ok(limited.headers.get('retry-after'));
    time = 3_600_001; assert.equal((await post(url)).status, 200);
  }, () => time);
});

test('invalid or sensitive provider errors never reach client, extra output fields are dropped', async () => {
  for (const output of [{ ...example, pages: [] }, { ...example, title: '' }, { ...example, pages: Array(5).fill({ text: 'ok', emoji: '' }) }]) {
    await withServer(false, async () => output, async url => assert.equal((await post(url)).status, 502));
  }
  await withServer(false, async () => { throw new Error('SECRET_PROVIDER_KEY PRIVATE_TEST'); }, async url => {
    const result = await post(url); assert.equal(result.status, 502); assert.doesNotMatch(await result.text(), /SECRET|PRIVATE_TEST|stack/);
  });
  await withServer(false, async () => ({ ...example, providerSecret: 'SECRET' }), async url => {
    assert.deepEqual(await (await post(url)).json(), example);
  });
});

test('static CSP forbids inline scripts, eval, plugins and arbitrary connections', () => {
  assert.match(browserPolicy, /script-src 'self' https:\/\/apis.google.com;/); assert.doesNotMatch(browserPolicy, /unsafe-eval/);
  assert.match(browserPolicy, /object-src 'none'/); assert.match(browserPolicy, /connect-src 'self' https:\/\/api.arasaac.org https:\/\/identitytoolkit.googleapis.com https:\/\/securetoken.googleapis.com https:\/\/firestore.googleapis.com https:\/\/neuroplaneta-bdaf9.firebaseapp.com;/);
});

test('board import permits raster and bundled symbols, rejects remote images, SVG and prototype keys', () => {
  const image = 'data:image/png;base64,iVBORw0KGgo=';
  assert.equal(safeImageSource(image), image);
  for (const bad of ['https://api.arasaac.org/api/pictograms/123', 'https://attacker.invalid/track.png', 'http://127.0.0.1/private', 'javascript:alert(1)', 'data:image/svg+xml;base64,PHN2Zz4=', 'https://api.arasaac.org.attacker.invalid/api/pictograms/1', 'https://api.arasaac.org/api/pictograms/1?name=PRIVATE', 'https://u:p@api.arasaac.org/api/pictograms/1']) {
    assert.equal(safeImageSource(bad), undefined);
    assert.throws(() => parseBoardImages(JSON.stringify({ format: 'open-board-v1', buttons: [{ id: 'tengo_sed', image_url: bad }] }), ['tengo_sed']));
  }
  assert.equal(safeImageSource('np-symbol:1F4A7'), '/pictograms/openmoji/1F4A7.svg');
  assert.equal(safeImageSource('np-symbol:DEADBEEF'), undefined);
  const bundled = parseBoardImages(JSON.stringify({ format: 'open-board-v1', buttons: [{ id: 'tengo_sed', neuroplaneta_symbol: 'np-symbol:1F4A7' }] }), ['tengo_sed']);
  assert.equal(bundled.tengo_sed, 'np-symbol:1F4A7');
  const restored = parseBoardImages(JSON.stringify({ format: 'open-board-v1', buttons: [{ id: 'tengo_sed', image_url: image }, { id: '__proto__', image_url: image }] }), ['tengo_sed']);
  assert.deepEqual(Object.keys(restored), ['tengo_sed']); assert.equal(Object.getPrototypeOf(restored), null);
  assert.throws(() => parseBoardImages(' '.repeat(MAX_BOARD_BYTES + 1), []));
  assert.throws(() => parseBoardImages(JSON.stringify({ format: 'open-board-v1', buttons: Array(101).fill({}) }), []));
  assert.throws(() => parseBoardImages('{}', []));
});

test('concurrency limit refuses a third provider request and recovers after completion', async () => {
  const releases: Array<() => void> = [];
  const pending: Array<Promise<Response>> = [];
  await withServer(false, async () => {
    await new Promise<void>(resolve => releases.push(resolve));
    return example;
  }, async url => {
    pending.push(post(url), post(url));
    const deadline = Date.now() + 2000;
    while (releases.length < 2 && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 5));
    assert.equal(releases.length, 2);
    assert.equal((await post(url)).status, 429);
    releases.forEach(release => release());
    const responses = await Promise.all(pending);
    assert.deepEqual(responses.map(response => response.status), [200, 200]);
  });
});

test('malformed trailing bytes after gzip are rejected and the server keeps responding', async () => {
  let calls = 0;
  await withServer(false, async () => { calls++; return example; }, async url => {
    const body = Buffer.concat([gzipSync(JSON.stringify(valid)), Buffer.from('invalid trailing gzip bytes')]);
    const response = await fetch(`${url}/api/social-stories/draft`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Encoding': 'gzip' }, body });
    assert.equal(response.status, 400);
    assert.doesNotMatch(await response.text(), /stack|zlib|Error:/);
    assert.equal(calls, 0);
    assert.equal((await post(url)).status, 200);
    assert.equal(calls, 1);
  });
});
