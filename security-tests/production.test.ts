import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { readdir, readFile } from 'node:fs/promises';

test('public build has static policy and never includes server code', async () => {
  const files = await readdir('dist', { recursive: true });
  assert.ok(!files.some(file => /\.(cjs|map)$/.test(file)));
  const html = await readFile('dist/index.html', 'utf8');
  assert.match(html, /http-equiv="Content-Security-Policy"/);
  assert.match(html, /name="referrer" content="no-referrer"/);
});

test('real production server blocks code and secrets, sends headers and keeps the app available', async () => {
  const reservation = createServer();
  await new Promise<void>(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const address = reservation.address(); assert.ok(address && typeof address !== 'string');
  const port = address.port;
  await new Promise<void>(resolve => reservation.close(() => resolve()));
  const child = spawn(process.execPath, ['build/server.cjs'], { env: { ...process.env, NODE_ENV: 'production', PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Production server did not start')), 8000);
      child.once('exit', code => { clearTimeout(timer); reject(new Error(`Server exited: ${code}`)); });
      child.stdout.once('data', () => { clearTimeout(timer); resolve(); });
    });
    const url = `http://127.0.0.1:${port}`;
    const home = await fetch(url);
    assert.equal(home.status, 200); assert.match(await home.text(), /NeuroPlaneta/);
    assert.equal(home.headers.get('x-powered-by'), null);
    assert.match(home.headers.get('content-security-policy') || '', /frame-ancestors/);
    for (const path of ['/server.cjs', '/server%2ecjs', '/server.cjs.map', '/.env', '/.git/config']) {
      assert.equal((await fetch(url + path)).status, 404, path);
    }
    assert.equal((await fetch(`${url}/api/social-stories/draft`, { method: 'POST' })).status, 503);
  } finally { child.kill(); }
});
