import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApiApp } from '../server/app';
import { commercialConfig, publicConfig } from '../server/commercial/config';
import type { MessageRepository, SupportMessage } from '../server/commercial/messages';
import type { PrivacyRepository } from '../server/commercial/privacy';
import { DEFAULT_CONFIG, policySections } from '../commercial/policy';

test('public contact stays private even when server environment contains contact details', () => {
  const privateConfig = commercialConfig({ LEGAL_ADDRESS: 'Private example street 123', SUPPORT_EMAIL: 'private@example.invalid' });
  const published = publicConfig(privateConfig);
  assert.equal(published.address, ''); assert.equal(published.supportEmail, '');
  assert.equal(DEFAULT_CONFIG.address, ''); assert.equal(DEFAULT_CONFIG.supportEmail, '');
  for (const kind of ['privacy', 'terms'] as const) {
    const text = JSON.stringify(policySections(privateConfig, kind));
    assert.ok(!text.includes(privateConfig.address)); assert.ok(!text.includes(privateConfig.supportEmail)); assert.match(text, /Mensajes/);
  }
  assert.equal(privateConfig.enforce, false);
});
test('support HTTP enforces verified accounts, ownership, administrator rights, origin and bounded messages', async () => {
  const rows = new Map<string, SupportMessage & { uid: string }>(); let limited = false;
  const messages: MessageRepository = {
    async send(a, id, subject, message) { const key = (a.uid === 'one' ? 'a' : 'b').repeat(64); rows.set(key, { id: key, uid: a.uid, email: a.email, subject, message, createdAt: 100, read: false }); return key; },
    async list(a) { return { messages: [...rows.values()].filter(r => a.admin || r.uid === a.uid), next: null }; },
    async markRead(id) { rows.get(id)!.read = true; },
  };
  const privacy: PrivacyRepository = { consume: async () => !limited, async request() { return ''; }, async export() { return {}; }, async list() { return []; }, async close() {}, async suppress() {}, async maintain() { return 0; } };
  const config = commercialConfig({ COMMERCIAL_APP_URL: 'https://neuro.example.invalid' });
  const app = createApiApp({ production: false, commercial: { config, deps: { messages, privacy, async verify(token) {
    if (token.startsWith('revoked')) throw Object.assign(Error('revoked'), { code: 'auth/id-token-revoked' });
    const uid = token.startsWith('other') ? 'two' : 'one';
    return { uid, email: `${uid}@example.invalid`, admin: token.startsWith('admin'), authTime: 0 };
  } } } });
  const server = app.listen(0, '127.0.0.1'); await new Promise<void>(r => server.once('listening', r));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}/api/support/`;
  const send = (path: string, body?: object, token = 'valid-fictional-token-0000', origin = config.origin) => fetch(url + path, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token}`, Origin: origin, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const body = { id: '11111111-1111-4111-8111-111111111111', subject: 'Consulta', message: 'No puedo abrir una pantalla.' };
  try {
    assert.equal((await fetch(url + 'messages')).status, 401);
    assert.equal((await send('messages', body, 'revoked-fictional-token-0000')).status, 401);
    assert.equal((await send('messages', body, undefined, 'https://evil.invalid')).status, 403);
    for (const invalid of [{ ...body, uid: 'victim' }, { ...body, message: ' ' }, { ...body, subject: 'x'.repeat(121) }, { ...body, message: 'x'.repeat(1501) }]) assert.equal((await send('messages', invalid)).status, 400);
    assert.equal((await send('messages', body)).status, 201);
    assert.equal((await send('messages', body, 'other-fictional-token-0000')).status, 201);
    assert.equal((await (await send('messages')).json()).messages.length, 1);
    assert.equal((await (await send('messages', undefined, 'other-fictional-token-0000')).json()).messages[0].email, 'two@example.invalid');
    assert.equal((await send('admin/messages')).status, 403);
    assert.equal((await send('admin/messages/' + 'a'.repeat(64) + '/read', {})).status, 403);
    assert.equal((await (await send('admin/messages', undefined, 'admin-fictional-token-0000')).json()).messages.length, 2);
    assert.equal((await send('admin/messages/' + 'a'.repeat(64) + '/read', {}, 'admin-fictional-token-0000')).status, 200);
    assert.equal(rows.get('a'.repeat(64))!.read, true);
    assert.equal((await send('messages?cursor=../bad')).status, 400);
    limited = true; assert.equal((await send('messages', body)).status, 429);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});
