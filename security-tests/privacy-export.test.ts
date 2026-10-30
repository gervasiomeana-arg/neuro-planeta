import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FirestorePrivacyRepository, type PrivacyRepository } from '../server/commercial/privacy';
import { createApiApp } from '../server/app';
import { commercialConfig } from '../server/commercial/config';

const owner = { uid: 'export-fictional', email: 'adult@example.invalid', admin: true, authTime: Date.now() };

test('account export scopes every read, preserves all history and strips checkout credentials without writing', async () => {
  const records: Record<string, Array<{ id: string; data: Record<string, unknown> }>> = {
    [`families/${owner.uid}/profiles`]: [{ id: 'profile-one', data: { name: 'Fictional profile' } }],
    accessEvents: [{ id: 'event-one', data: { ownerUid: owner.uid, provider: 'Google' } }],
    commercialAccounts: [{ id: 'subscription-one', data: { uid: owner.uid, status: 'CANCELLED', checkoutKey: 'private-checkout', approvalUrl: 'https://example.invalid/private-approval' } }],
    commercialReceipts: [{ id: 'receipt-one', data: { uid: owner.uid, currency: 'USD' } }],
    dataRightsRequests: Array.from({ length: 55 }, (_, i) => ({ id: `request-${i}`, data: { uid: owner.uid, status: i ? 'closed' : 'open', resolution: `Fictional response ${i}` } })),
    supportMessages: [{ id: 'message-one', data: { uid: owner.uid, message: 'Fictional support message' } }],
  };
  for (const name of ['accessEvents', 'commercialAccounts', 'commercialReceipts', 'dataRightsRequests', 'supportMessages']) {
    records[name].push({ id: 'other-account', data: { uid: 'other', ownerUid: 'other', private: 'OTHER-ACCOUNT-DATA' } });
  }
  const before = JSON.stringify(records), reads: string[] = [];
  const db = {
    doc(path: string) {
      assert.equal(path, `families/${owner.uid}`);
      return { async get() { reads.push(path); return { data: () => ({ ownerUid: owner.uid }) }; } };
    },
    collection(path: string) {
      const snapshot = (rows: typeof records[string]) => ({ docs: rows.map(row => ({ id: row.id, data: () => row.data })) });
      if (path === `families/${owner.uid}/profiles`) return { async get() { reads.push(path); return snapshot(records[path]); } };
      return { where(field: string, operator: string, value: string) {
        assert.equal(field, path === 'accessEvents' ? 'ownerUid' : 'uid');
        assert.equal(operator, '=='); assert.equal(value, owner.uid);
        return { async get() { reads.push(path); return snapshot(records[path].filter(row => row.data[field] === value)); } };
      } };
    },
  };
  const repository = new FirestorePrivacyRepository((() => ({ db })) as any);
  const exported = await repository.export(owner);
  assert.equal(reads.length, 7);
  assert.deepEqual(exported.account, { uid: owner.uid, email: owner.email });
  assert.equal(exported.requests.length, 55); // The UI's 50-row limit must not truncate the export.
  assert.equal((exported.requests[54] as Record<string, unknown>).resolution, 'Fictional response 54');
  assert.equal(exported.messages[0].id, 'message-one');
  assert.equal(exported.profiles[0].id, 'profile-one');
  assert.equal(exported.subscriptions[0].status, 'CANCELLED');
  assert.ok(Number.isFinite(Date.parse(exported.exportedAt)));
  assert.doesNotMatch(JSON.stringify(exported), /OTHER-ACCOUNT-DATA|private-checkout|private-approval|checkoutKey|approvalUrl/);
  assert.equal(JSON.stringify(records), before);
});

test('export HTTP uses the verified identity, disables caching and returns safe errors without mutations', async () => {
  let fail = false, calls = 0;
  const privacy = {
    async consume() { return true; },
    async export(account: typeof owner) {
      calls++; if (fail) throw Error('PRIVATE-PROVIDER-DETAIL');
      return { account: { uid: account.uid }, requests: [] };
    },
  } as unknown as PrivacyRepository;
  const app = createApiApp({ production: false, commercial: { config: commercialConfig({}), deps: { privacy, async verify(token) {
    if (token.startsWith('revoked')) throw { code: 'auth/id-token-revoked' };
    return { ...owner, uid: token.startsWith('second') ? 'second-fictional' : owner.uid };
  } } } });
  const server = app.listen(0, '127.0.0.1'); await new Promise<void>(r => server.once('listening', r));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}/api/privacy/export?uid=other-account`;
  const run = (token?: string) => fetch(url, { headers: token ? { Authorization: `Bearer ${token}-fictional-token-00000` } : {} });
  try {
    assert.equal((await run()).status, 401); assert.equal(calls, 0);
    assert.equal((await run('revoked')).status, 401); assert.equal(calls, 0);
    const response = await run('first'); assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.match(response.headers.get('content-disposition') || '', /attachment; filename="neuroplaneta-datos-cuenta.json"/);
    assert.deepEqual(await response.json(), { account: { uid: owner.uid }, requests: [] });
    assert.equal((await (await run('second')).json()).account.uid, 'second-fictional');
    fail = true; const error = await run('first'); assert.equal(error.status, 503);
    assert.doesNotMatch(await error.text(), /PRIVATE-PROVIDER-DETAIL/);
  } finally { await new Promise<void>(r => server.close(() => r())); }
});
